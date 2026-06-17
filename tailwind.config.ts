import type { Config } from 'tailwindcss';

// 디자인 토큰(크림/잉크/살구)은 step3 에서 채운다. 지금은 기본 설정만.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
