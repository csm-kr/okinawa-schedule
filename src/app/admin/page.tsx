// 관리자 `/admin` — 서버에서 세션 쿠키를 검증해(R3) 인증이면 AdminForm(현재 일정 주입),
// 아니면 AdminLogin 을 렌더한다. 데이터(KV) 접근은 서버에서만(R1). 클라이언트는 인증 판단을 하지 않는다.
import { cookies } from 'next/headers';
import { getStore } from '@/services/storage';
import { SESSION_COOKIE_NAME, verifySessionCookie } from '@/lib/auth';
import { AdminLogin } from '@/components/admin-login';
import { AdminForm } from '@/components/admin-form';
import type { Itinerary } from '@/types/itinerary';

// 일정이 아직 없을 때 편집을 시작할 빈 문서.
function emptyItinerary(): Itinerary {
  return {
    title: '조인수 · 김인숙 부부 환갑잔치',
    timezone: 'Asia/Seoul',
    version: 0,
    updatedAt: new Date().toISOString(),
    days: [],
  };
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authed = verifySessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const itinerary = authed ? ((await getStore().get()) ?? emptyItinerary()) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-4 pb-16 pt-6">
      <header>
        <h1 className="text-header font-bold text-ink">일정 편집</h1>
      </header>
      {authed && itinerary ? <AdminForm initial={itinerary} /> : <AdminLogin />}
    </main>
  );
}
