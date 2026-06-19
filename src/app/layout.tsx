import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { SwRegister } from '@/components/sw-register';

// 디스플레이 세리프(히어로 타이틀·날짜) — 우아·축하 무드.
const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

// 한글 본문 — 깔끔한 산세리프. Pretendard 대체로 Noto Sans KR 를 var 로 연결한다.
const sans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-pretendard',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '칠순잔치 안내',
  description: '조인수 · 김인숙 부부 칠순잔치 가족 안내',
  manifest: '/manifest.json',
  // iOS 홈화면 추가 — apple-touch-icon, status bar, 앱 타이틀.
  appleWebApp: {
    capable: true,
    title: '칠순잔치',
    statusBarStyle: 'black-translucent',
  },
  // Next 는 appleWebApp.capable 에 대해 최신 `mobile-web-app-capable` 만 방출한다.
  // iOS Safari 홈화면 추가 호환을 위해 deprecated 한 `apple-mobile-web-app-capable` 도 명시한다.
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

// theme-color 는 viewport 로 분리(Next 메타 API). 크림+살구 모던 베이스에 맞춘 따뜻한 크림.
// 모바일에서 핀치 확대/축소를 막고 상하 스크롤만 허용한다(iOS·안드 공통). 본문이 이미 18px+ 라
// 확대 의존도가 낮고, 잘못된 확대로 레이아웃이 틀어지는 것을 방지한다.
export const viewport: Viewport = {
  themeColor: '#FBF4E9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
