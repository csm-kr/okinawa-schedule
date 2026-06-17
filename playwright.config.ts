import { defineConfig, devices } from '@playwright/test';

// 모바일 전용 앱 — 아이폰(WebKit/Mobile Safari)·안드로이드(Chromium/Mobile Chrome) 두 기기 에뮬레이션.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
    { name: 'android', use: { ...devices['Pixel 5'] } },
  ],
});
