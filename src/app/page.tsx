// 공개 타임라인 `/` — 서버 컴포넌트가 storage 로 일정을 읽어 전달한다(R1, 데이터는 서버에서만).
// 기본 선택 날짜 = 오늘(KST), 기간 밖이면 1일차. 강조 갱신은 클라이언트 래퍼(TimelineView)가 한다.
import { getStore } from '@/services/storage';
import { TimelineView } from '@/components/timeline-view';

// 오늘 날짜를 Asia/Seoul 기준 "YYYY-MM-DD" 로 구한다(R7 — 기기 로컬 tz 의존 금지).
function kstToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default async function Home() {
  const itinerary = await getStore().get();
  const today = kstToday();
  const initialDayId =
    itinerary?.days.find((d) => d.date === today)?.id ?? itinerary?.days[0]?.id;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-4 pb-16 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-header font-bold text-ink">
          {itinerary?.title ?? '조인수 · 김인숙 여사님 환갑잔치'}
        </h1>
        {itinerary?.subtitle && <p className="text-body text-ink-muted">{itinerary.subtitle}</p>}
      </header>
      <TimelineView itinerary={itinerary} initialDayId={initialDayId} />
    </main>
  );
}
