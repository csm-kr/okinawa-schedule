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
    // E2E 는 인메모리 저장소로 기동하고, 테스트가 login+PUT 로 일정을 시드한다.
    // 비밀은 테스트 전용 값(프로덕션 비밀과 무관).
    env: {
      STORAGE_DRIVER: 'memory',
      ADMIN_PASSWORD: 'e2e-test-password',
      ADMIN_COOKIE_SECRET: 'e2e-test-cookie-secret-not-for-production',
    },
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
    { name: 'android', use: { ...devices['Pixel 5'] } },
  ],
});
