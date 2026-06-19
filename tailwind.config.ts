import type { Config } from 'tailwindcss';

// 디자인 토큰 — "Cream & Apricot Modern": 따뜻한 크림 베이스 + 살구/코랄 강조를 모던하게.
// 라이트 글래스 + 살구→앰버 그라데이션 + 은은한 글로우/모션. 본문 18px 유지.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF4E9', // 페이지 베이스(따뜻한 크림)
        ink: {
          DEFAULT: '#34302B', // 크림 위 본문(딥 잉크)
          muted: '#8A7F76', // 보조·past
        },
        coral: {
          DEFAULT: '#E07A5F', // 살구 코랄(강조·"지금")
          strong: '#C75B43', // 라벨 보강(대비 AA)
        },
        // 모던 크림+살구 팔레트
        night: {
          DEFAULT: '#3A2C20', // 따뜻한 대비(밝은 면 위 라벨)
          deep: '#2A2019', // 밝은 칩 위 텍스트
          soft: '#F3E7D6', // 크림 보조 면/점
        },
        gold: {
          DEFAULT: '#E59A52', // 따뜻한 앰버(보조 강조)
          bright: '#F3B36C', // 하이라이트
          deep: '#B96A2A', // 라벨/대비
        },
        aqua: {
          DEFAULT: '#3E9E8E', // 소프트 틸(장소·트로피컬 힌트)
          deep: '#2C7E72',
        },
        sunset: '#F2784B',
        amber: '#F4A82F',
        plum: '#D2624A',
        surface: '#FFFFFF', // 레거시 카드(어드민)
        line: '#EFE0CE', // 크림 경계선
        glass: 'rgba(255,255,255,0.6)',
        'glass-line': 'rgba(60,40,20,0.08)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: [
          'var(--font-pretendard)',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        meta: ['1rem', { lineHeight: '1.5' }],
        body: ['1.125rem', { lineHeight: '1.6' }],
        title: ['1.375rem', { lineHeight: '1.45' }],
        time: ['1.4375rem', { lineHeight: '1.35' }],
        header: ['2rem', { lineHeight: '1.2' }],
        status: ['1.75rem', { lineHeight: '1.35' }],
        hero: ['2.5rem', { lineHeight: '1.12' }],
      },
      backgroundImage: {
        'sunset-gradient': 'linear-gradient(120deg,#F2784B 0%,#F4A82F 55%,#F6C06A 100%)',
        'gold-gradient': 'linear-gradient(110deg,#F2A86B 0%,#E07A5F 45%,#C75B43 100%)',
        'aqua-gradient': 'linear-gradient(120deg,#48B0A0 0%,#2C7E72 100%)',
        'glass-sheen': 'linear-gradient(135deg,rgba(255,255,255,0.7) 0%,rgba(255,255,255,0.2) 40%,rgba(255,255,255,0) 70%)',
      },
      boxShadow: {
        glass: '0 12px 32px -14px rgba(120,70,30,0.22), inset 0 1px 0 0 rgba(255,255,255,0.7)',
        'glow-coral': '0 0 0 1px rgba(224,122,95,0.30), 0 8px 24px -8px rgba(224,122,95,0.5)',
        'glow-gold': '0 0 0 1px rgba(229,154,82,0.26), 0 10px 28px -10px rgba(229,154,82,0.45)',
        'glow-aqua': '0 0 24px -6px rgba(62,158,142,0.35)',
        lift: '0 18px 44px -20px rgba(120,70,30,0.35)',
      },
      keyframes: {
        shake: {
          '10%,90%': { transform: 'translateX(-1px)' },
          '20%,80%': { transform: 'translateX(2px)' },
          '30%,50%,70%': { transform: 'translateX(-4px)' },
          '40%,60%': { transform: 'translateX(4px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(224,122,95,0.5)' },
          '50%': { boxShadow: '0 0 0 10px rgba(224,122,95,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-12px) translateX(6px)' },
        },
        'gradient-pan': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.8s ease both',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        shimmer: 'shimmer 3.5s linear infinite',
        float: 'float 9s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 12s ease infinite',
      },
    },
  },
  plugins: [],
};

export default config;
