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
    <div className="aurora">
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-7 px-4 pb-20 pt-10">
        <header className="relative flex flex-col items-center gap-3 text-center animate-fade-up">
          {/* 환갑 = 축하·골드. 작은 윗줄 라벨. */}
          <p className="flex items-center gap-2 text-meta font-medium uppercase tracking-[0.32em] text-gold">
            <span aria-hidden>✦</span>
            <span className="tracking-[0.32em]">환갑잔치</span>
            <span aria-hidden>✦</span>
          </p>

          <h1 className="font-display text-[2.1rem] font-extrabold leading-[1.18] text-gold-gradient drop-shadow-[0_2px_18px_rgba(244,199,123,0.25)] [text-wrap:balance] [word-break:keep-all]">
            {itinerary?.title ?? '조인수 · 김인숙 여사님 환갑잔치'}
          </h1>

          <div className="gold-rule mt-1 w-32" aria-hidden />

          {itinerary?.subtitle && (
            <p className="mt-1 flex items-center gap-2 text-body font-medium text-ink/90">
              <span aria-hidden>🌴</span>
              <span>{itinerary.subtitle}</span>
              <span aria-hidden>🌺</span>
            </p>
          )}
        </header>

        <TimelineView itinerary={itinerary} initialDayId={initialDayId} />
      </main>
    </div>
  );
}
