import type { Config } from 'tailwindcss';

// 디자인 토큰(DESIGN_GUIDE) — 크림 베이스 + 살구 포인트 1색, 어르신 가독성용 큰 글씨.
// 살구(coral)는 면에만, 글자/버튼 라벨은 coral-strong(R8). 타입스케일은 rem 기반.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF9F3', // 페이지 베이스
        ink: {
          DEFAULT: '#3D3430', // 본문·제목
          muted: '#8A7F76', // past 일정·보조
        },
        coral: {
          DEFAULT: '#E07A5F', // "지금" 바·점·뱃지 배경(면에만)
          strong: '#C75B43', // 살구가 글자/버튼 라벨일 때(대비 보강, AA)
        },
        surface: '#FFFFFF', // 카드·입력 표면
        line: '#EFE4DA', // 경계선
      },
      fontSize: {
        // 본문 하한 18px(1.125rem). 14px 미만 금지.
        meta: ['1rem', { lineHeight: '1.5' }], // 16px 보조/메모(절대 하한)
        body: ['1.125rem', { lineHeight: '1.6' }], // 18px 본문/장소
        title: ['1.3125rem', { lineHeight: '1.5' }], // 21px 일정 제목
        time: ['1.375rem', { lineHeight: '1.4' }], // 22px 시간 숫자
        header: ['1.5rem', { lineHeight: '1.4' }], // 24px 화면 헤더
        status: ['1.625rem', { lineHeight: '1.4' }], // 26px 현재 상태 카드 제목
      },
    },
  },
  plugins: [],
};

export default config;
