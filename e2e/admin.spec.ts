import { test, expect, request, type Page, type APIRequestContext } from '@playwright/test';
import type { Itinerary } from '../src/types/itinerary';

// USER_FLOW 플로우2(편집 경로)를 iphone·android 두 기기 에뮬에서 재현한다.
// 인메모리 저장소는 두 프로젝트가 공유하므로(단일 서버), 쓰기 충돌은 재시도로 흡수한다.

const PASSWORD = 'e2e-test-password';
const CONFLICT_MESSAGE = '다른 곳에서 일정이 바뀌었어요. 새로고침 후 다시 저장해 주세요';

const seedItinerary: Itinerary = {
  title: '조인수 · 김인숙 부부 칠순잔치',
  subtitle: '9.19–21',
  timezone: 'Asia/Seoul',
  version: 0,
  updatedAt: '2026-09-01T00:00:00.000Z',
  days: [
    {
      id: 'd1',
      date: '2026-09-19',
      label: '1일차',
      items: [
        { id: 'i1', startTime: '09:00', endTime: '10:00', title: '도착·체크인', location: '호텔 로비' },
        { id: 'i3', startTime: '18:00', endTime: '20:00', title: '가족 만찬', location: '한정식 본관' },
      ],
    },
    { id: 'd2', date: '2026-09-20', label: '2일차', items: [{ id: 'j1', startTime: '09:00', title: '조식' }] },
  ],
};

// 브라우저 컨텍스트와 분리된 쿠키 jar 로 시드/버전 증가를 수행한다(페이지의 로그인 상태를 오염시키지 않음).
// 성공 시 stored version 을 +1 한다. 동시 프로젝트의 충돌(409)은 재시도로 흡수.
async function seedViaApi(baseURL: string): Promise<void> {
  const ctx: APIRequestContext = await request.newContext({ baseURL });
  try {
    const login = await ctx.post('/api/admin/login', { data: { password: PASSWORD } });
    expect(login.ok()).toBeTruthy();
    for (let attempt = 0; attempt < 6; attempt++) {
      const getRes = await ctx.get('/api/itinerary');
      const { data } = (await getRes.json()) as { data: Itinerary | null };
      const expectedVersion = data?.version ?? 0;
      const put = await ctx.put('/api/itinerary', {
        data: { itinerary: { ...seedItinerary, version: expectedVersion }, expectedVersion },
      });
      if (put.ok()) return;
      if (put.status() !== 409) throw new Error(`seed PUT 실패: ${put.status()}`);
    }
    throw new Error('seed: version 충돌이 반복됨');
  } finally {
    await ctx.dispose();
  }
}

// 공용 비밀번호로 UI 로그인 → 편집 화면 진입. 하이드레이션 전 fill/click 은 controlled input 의
// React state 를 갱신하지 못하므로(DOM 값만 설정됨, 하이드레이션이 초기화), 편집 화면(저장 버튼)이
// 보일 때까지 fill→제출 사이클 전체를 재시도한다. 하이드레이션 후 사이클은 정상 동작한다.
async function loginUI(page: Page): Promise<void> {
  await page.goto('/admin');
  const pw = page.getByLabel('가족 비밀번호');
  const save = page.getByRole('button', { name: '저장' });
  await expect(async () => {
    if (await save.isVisible().catch(() => false)) return; // 이전 사이클로 이미 로그인됨
    await pw.fill(PASSWORD);
    await page.getByRole('button', { name: '들어가기' }).click();
    await expect(save).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 25_000 });
}

test('틀린 비밀번호로는 편집 화면에 들어가지 못한다', async ({ page }) => {
  await page.goto('/admin');
  const pw = page.getByLabel('가족 비밀번호');
  // 하이드레이션 후에만 React onSubmit 이 입력값을 읽는다 → 에러 안내가 뜰 때까지 사이클 재시도.
  await expect(async () => {
    await pw.fill('wrong-password');
    await page.getByRole('button', { name: '들어가기' }).click();
    await expect(page.getByText('비밀번호가 달라요')).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 20_000 });

  await expect(page.getByRole('button', { name: '저장' })).toHaveCount(0); // 편집 화면 미진입
});

test('로그인 후 항목을 추가·저장하면 공개 /에 반영된다', async ({ page, baseURL }, testInfo) => {
  await seedViaApi(baseURL!);
  await loginUI(page);

  // 프로젝트별 고유 제목 — 두 기기 프로젝트가 같은 저장소를 공유해도 충돌 없이 각자 검증.
  const title = `E2E 새 일정 ${testInfo.project.name}`;

  // 저장 성공까지 재시도: (a) 동시 프로젝트의 version 증가로 인한 409, (b) 하이드레이션 전 클릭으로
  // 추가가 안 된 경우를 모두 reload 후 흡수한다.
  let saved = false;
  for (let attempt = 0; attempt < 8 && !saved; attempt++) {
    if (attempt > 0) {
      await page.reload();
      await expect(page.getByRole('button', { name: '저장' })).toBeVisible({ timeout: 10_000 });
    }

    const titles = page.getByLabel('제목');
    const before = await titles.count();
    await page.getByRole('button', { name: '+ 일정 추가' }).click();
    try {
      await expect(titles).toHaveCount(before + 1, { timeout: 3000 });
    } catch {
      continue; // 하이드레이션 전 클릭 → reload 후 재시도
    }

    const last = titles.last();
    await last.fill(title);
    await expect(last).toHaveValue(title);
    await page.getByRole('button', { name: '저장' }).click();

    const toast = page.getByText('저장됐어요');
    await expect(toast.or(page.getByText(CONFLICT_MESSAGE))).toBeVisible({ timeout: 10_000 });
    saved = await toast.isVisible();
  }
  expect(saved).toBeTruthy();

  // 공개 화면 반영(revalidatePath('/')). 오늘(기간 밖)은 1일차가 기본 탭이며 새 항목이 거기에 있다.
  await page.goto('/');
  await expect(page.getByText(title)).toBeVisible();
});

test('stale version 으로 저장하면 409 충돌을 안내한다', async ({ page, baseURL }) => {
  await seedViaApi(baseURL!);
  await loginUI(page); // 폼이 현재 version 을 들고 로드된다.

  // 폼 로드 이후 외부에서 저장 → 폼이 든 version 이 stale 해진다.
  await seedViaApi(baseURL!);

  // 저장(stale expectedVersion) → 409 충돌 안내. 하이드레이션 전 클릭 대비 재시도(재클릭도 409).
  await expect(async () => {
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(CONFLICT_MESSAGE)).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 15_000 });
});
