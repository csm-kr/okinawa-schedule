import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SwRegister } from '@/components/sw-register';

export const metadata: Metadata = {
  title: '환갑잔치 안내',
  description: '조인수 · 김인숙 여사님 환갑잔치 가족 안내',
  manifest: '/manifest.json',
  // iOS 홈화면 추가 — apple-touch-icon, status bar, 앱 타이틀.
  appleWebApp: {
    capable: true,
    title: '환갑잔치',
    statusBarStyle: 'default',
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

// theme-color 는 viewport 로 분리(Next 메타 API). DESIGN_GUIDE 포인트색.
export const viewport: Viewport = {
  themeColor: '#E07A5F',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
