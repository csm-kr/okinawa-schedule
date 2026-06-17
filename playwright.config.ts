import { defineConfig, devices } from '@playwright/test';

// 모바일 전용 앱 — 아이폰(WebKit/Mobile Safari)·안드로이드(Chromium/Mobile Chrome) 두 기기 에뮬레이션.
export default defineConfig({
  testDir: 'e2e',
  // 직렬 실행: 모든 E2E 가 단일 인메모리 저장소(STORAGE_DRIVER=memory)를 공유하므로, 병렬로 돌리면
  // 한 테스트의 시드/저장(+revalidatePath('/'))이 다른 테스트의 기대 상태를 덮어써 레이스가 난다.
  // 앱은 단일 일정 문서가 설계상 맞으므로 테스트별 저장소 격리 대신 직렬로 격리한다.
  fullyParallel: false,
  workers: 1,
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
