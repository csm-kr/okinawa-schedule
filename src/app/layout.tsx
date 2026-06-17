import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '환갑잔치 안내',
  description: '조인수 · 김인숙 여사님 환갑잔치 가족 안내',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
