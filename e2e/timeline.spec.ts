import { test, expect, type Page } from '@playwright/test';
import type { Itinerary } from '../src/types/itinerary';

// USER_FLOW 플로우1(공개 타임라인 핵심 경로)을 iphone·android 두 기기 에뮬에서 재현한다.
// 시각 의존 검증은 page.clock 으로 결정론적으로 고정한다.

const PASSWORD = 'e2e-test-password';

const seedItinerary: Itinerary = {
  title: '조인수 · 김인숙 여사님 환갑잔치',
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
        { id: 'i2', startTime: '12:00', title: '점심', location: '호텔 뷔페' },
        { id: 'i3', startTime: '18:00', endTime: '20:00', title: '가족 만찬', location: '한정식 본관' },
        { id: 'i4', startTime: '20:30', title: '케이크 커팅' },
      ],
    },
    {
      id: 'd2',
      date: '2026-09-20',
      label: '2일차',
      items: [
        { id: 'j1', startTime: '09:00', title: '조식' },
        { id: 'j2', startTime: '11:00', title: '체크아웃' },
      ],
    },
  ],
};

// login → 현재 version 읽기 → 전체 PUT. 병렬 프로젝트가 같은 인메모리 저장소를 시드하므로
// 드문 version 충돌(409)은 재시도로 흡수한다.
async function seed(page: Page): Promise<void> {
  const login = await page.request.post('/api/admin/login', { data: { password: PASSWORD } });
  expect(login.ok()).toBeTruthy();

  for (let attempt = 0; attempt < 5; attempt++) {
    const getRes = await page.request.get('/api/itinerary');
    const { data } = (await getRes.json()) as { data: Itinerary | null };
    const expectedVersion = data?.version ?? 0;
    const put = await page.request.put('/api/itinerary', {
      data: { itinerary: { ...seedItinerary, version: expectedVersion }, expectedVersion },
    });
    if (put.ok()) return;
    if (put.status() !== 409) {
      throw new Error(`seed PUT 실패: ${put.status()}`);
    }
  }
  throw new Error('seed: version 충돌이 반복됨');
}

test.beforeEach(async ({ page }) => {
  await seed(page);
});

test('현재 시각 기준으로 진행 중인 일정을 상태 카드가 강조한다', async ({ page }) => {
  // 18:30 KST(2026-09-19) = 09:30 UTC → 가족 만찬(18:00~20:00) 진행 중
  await page.clock.setFixedTime(new Date('2026-09-19T09:30:00Z'));
  await page.goto('/');

  const card = page.getByTestId('status-card');
  await expect(card).toContainText('지금 진행 중');
  await expect(card).toContainText('가족 만찬');
  // 다음 항목(케이크 커팅) 미리보기
  await expect(card).toContainText('다음');
  await expect(card).toContainText('케이크 커팅');
});

test('날짜 탭으로 다른 날 일정을 본다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-19T09:30:00Z'));
  await page.goto('/');

  const list = page.getByTestId('timeline-list');
  await expect(list.getByText('가족 만찬')).toBeVisible(); // 1일차

  await page.getByRole('tab', { name: /2일차/ }).click();

  await expect(list.getByText('조식')).toBeVisible(); // 2일차
  await expect(list.getByText('가족 만찬')).toHaveCount(0);
});

test('본문은 18px 이상, 날짜 탭 터치 타깃은 48px 이상이다(R8)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-19T09:30:00Z'));
  await page.goto('/');

  const bodyFontPx = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.body).fontSize),
  );
  expect(bodyFontPx).toBeGreaterThanOrEqual(18);

  const tab = page.getByRole('tab').first();
  await expect(tab).toBeVisible(); // 측정 전 레이아웃 안정화 대기(하이드레이션)
  const box = await tab.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(48);
});
