import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // e2e 는 Playwright 가 돌린다 — Vitest 가 .spec 을 집어가지 않게 제외.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
