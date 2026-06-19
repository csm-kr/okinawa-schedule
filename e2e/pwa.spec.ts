import { test, expect } from '@playwright/test';

// PWA AC — 아이폰(webkit)·안드로이드(chromium) 두 기기 프로젝트 모두에서 통과해야 한다.
// 일정 데이터에 의존하지 않는다(메타/매니페스트/렌더만 검증) — 빈 상태에서도 헤더는 노출된다.

test('`/` 에 manifest 링크와 theme-color 메타가 있다', async ({ page }) => {
  await page.goto('/');

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
  expect(themeColor).toBe('#E07A5F'); // DESIGN_GUIDE theme_color
});

test('manifest 가 200 으로 응답하고 색·아이콘(192·512)이 DESIGN_GUIDE 와 일치한다', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);

  const manifest = (await res.json()) as {
    name: string;
    short_name: string;
    display: string;
    start_url: string;
    background_color: string;
    theme_color: string;
    icons: { src: string; sizes: string; type: string }[];
  };
  expect(manifest.name).toBe('칠순잔치 안내');
  expect(manifest.short_name).toBe('칠순잔치');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/');
  expect(manifest.background_color).toBe('#FFF9F3'); // cream
  expect(manifest.theme_color).toBe('#E07A5F'); // coral
  const sizes = manifest.icons.map((i) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
});

test('아이콘 PNG(192·512)가 200(image/png)으로 제공된다', async ({ page }) => {
  const r192 = await page.request.get('/icon-192.png');
  const r512 = await page.request.get('/icon-512.png');
  expect(r192.status()).toBe(200);
  expect(r512.status()).toBe(200);
  expect(r192.headers()['content-type']).toContain('image/png');
  expect(r512.headers()['content-type']).toContain('image/png');
});

test('모바일 뷰포트에서 헤더가 가로폭을 넘지 않고 보인다(렌더 깨짐 없음)', async ({ page }) => {
  await page.goto('/');

  const header = page.getByRole('heading', { level: 1 });
  await expect(header).toBeVisible();

  const box = await header.boundingBox();
  expect(box).not.toBeNull();

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  // 헤더가 모바일 뷰포트 가로폭을 넘지 않는다(가로 스크롤/레이아웃 깨짐 방지).
  expect(box!.width).toBeLessThanOrEqual(viewport!.width);
});

test('아이폰(webkit): 홈화면 추가용 apple 메타가 있다', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone', 'iphone(webkit) 전용 검증');
  await page.goto('/');

  const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect(appleIcon).toBeTruthy();

  const capable = await page
    .locator('meta[name="apple-mobile-web-app-capable"]')
    .getAttribute('content');
  expect(capable).toBe('yes');
});

test('안드로이드(chromium): manifest 설치 요건(standalone·아이콘 192·512)을 충족한다', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'android', 'android(chromium) 전용 검증');
  await page.goto('/');

  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = (await (await page.request.get(href!)).json()) as {
    display: string;
    icons: { sizes: string }[];
  };
  expect(manifest.display).toBe('standalone');
  const sizes = manifest.icons.map((i) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
});

test('안드로이드(chromium): service worker 가 /sw.js 로 등록된다', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'android', 'SW 등록은 chromium 에서 확인');
  await page.goto('/');

  await page.waitForFunction(
    async () => {
      const reg = await navigator.serviceWorker?.getRegistration();
      return !!reg;
    },
    null,
    { timeout: 10_000 },
  );

  const scriptURL = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg?.active?.scriptURL ?? reg?.installing?.scriptURL ?? reg?.waiting?.scriptURL ?? '';
  });
  expect(scriptURL).toContain('/sw.js');
});
