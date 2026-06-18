import type { Config } from 'tailwindcss';

// 디자인 토큰 — "Tropical Sunset Gold" 프리미엄 환갑+오키나와 테마.
// 깊은 황혼 그라데이션 베이스 + 골드/샴페인 + 코랄→앰버 선셋 + 아쿠아 트로피컬.
// 글래스모피즘·글로우·그라데이션 강조를 위해 색/그림자/그라데이션/키프레임을 확장한다.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF9F3', // 레거시(어드민 등) 호환용 베이스
        ink: {
          DEFAULT: '#FBF1E6', // 어두운 베이스 위 본문(따뜻한 아이보리)
          muted: '#B9A99C', // 보조·past
        },
        coral: {
          DEFAULT: '#F2784B', // 선셋 코랄(면·강조)
          strong: '#E25A2B', // 라벨 보강
        },
        // 새 팔레트
        night: {
          DEFAULT: '#1A1230', // 깊은 자정 보라
          deep: '#120C24', // 최심부
          soft: '#2A1E45', // 카드 베이스
        },
        gold: {
          DEFAULT: '#F4C77B', // 샴페인 골드
          bright: '#FFD98A', // 하이라이트
          deep: '#C8963E', // 골드 라벨/대비
        },
        aqua: {
          DEFAULT: '#3FD9C8', // 트로피컬 아쿠아
          deep: '#179C8E',
        },
        sunset: '#FF7E5F',
        amber: '#FFB155',
        plum: '#3B2360',
        surface: '#FFFFFF', // 레거시 카드(어드민)
        line: '#EFE4DA', // 레거시 경계선
        glass: 'rgba(255,255,255,0.08)',
        'glass-line': 'rgba(255,255,255,0.16)',
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
        // 본문 하한 18px(1.125rem) 유지.
        meta: ['1rem', { lineHeight: '1.5' }], // 16px 보조/메모
        body: ['1.125rem', { lineHeight: '1.6' }], // 18px 본문/장소
        title: ['1.375rem', { lineHeight: '1.45' }], // 22px 일정 제목
        time: ['1.4375rem', { lineHeight: '1.35' }], // 23px 시간
        header: ['2rem', { lineHeight: '1.2' }], // 32px 화면 헤더(디스플레이)
        status: ['1.75rem', { lineHeight: '1.35' }], // 28px 상태 카드 제목
        hero: ['2.5rem', { lineHeight: '1.12' }], // 40px 히어로 디스플레이
      },
      backgroundImage: {
        'sunset-gradient': 'linear-gradient(120deg,#FF7E5F 0%,#FFB155 50%,#F4C77B 100%)',
        'gold-gradient': 'linear-gradient(110deg,#FFD98A 0%,#F4C77B 45%,#C8963E 100%)',
        'aqua-gradient': 'linear-gradient(120deg,#3FD9C8 0%,#179C8E 100%)',
        'glass-sheen': 'linear-gradient(135deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 40%,rgba(255,255,255,0) 70%)',
      },
      boxShadow: {
        glass: '0 10px 40px -12px rgba(10,6,25,0.7), inset 0 1px 0 0 rgba(255,255,255,0.10)',
        'glow-coral': '0 0 0 1px rgba(242,120,75,0.35), 0 8px 30px -6px rgba(242,120,75,0.55)',
        'glow-gold': '0 0 0 1px rgba(244,199,123,0.4), 0 10px 36px -8px rgba(244,199,123,0.5)',
        'glow-aqua': '0 0 28px -4px rgba(63,217,200,0.5)',
        lift: '0 18px 50px -18px rgba(8,4,20,0.85)',
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
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(242,120,75,0.55)' },
          '50%': { boxShadow: '0 0 0 10px rgba(242,120,75,0)' },
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
