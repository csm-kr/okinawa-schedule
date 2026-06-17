import { test, expect } from '@playwright/test';

// 스모크: `/` 가 로드되고 행사명이 보이는지 — iphone·android 두 프로젝트 모두에서 통과해야 한다.
test('홈 화면에 행사명이 보인다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/환갑잔치/)).toBeVisible();
});
