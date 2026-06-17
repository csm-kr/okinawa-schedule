import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // tsconfig paths(@/* → src/*)를 vitest 런타임에도 적용. 기존 테스트는 모두 `import type`
  // 이라 erase 되어 드러나지 않았지만, route handler 는 값(runtime) import 가 필요하다.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // e2e 는 Playwright 가 돌린다 — Vitest 가 .spec 을 집어가지 않게 제외.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
