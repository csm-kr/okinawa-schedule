// 한 day 의 항목을 startTime 오름차순으로 렌더. 상태(past/current/upcoming)는
// getItemStatus 로 now(KST) 기준 계산한다(R7). 데이터 접근 없음 — 순수 표현.
import type { Day } from '@/types/itinerary';
import { getItemStatus } from '@/lib/status';
import { TimelineItem } from './timeline-item';

type Props = {
  day: Day;
  now: Date;
};

export function TimelineList({ day, now }: Props) {
  const sorted = [...day.items].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <section className="glass animate-fade-up relative overflow-hidden rounded-3xl p-5 pt-4 shadow-glass">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-meta font-semibold uppercase tracking-[0.2em] text-gold">
          {day.label} 일정
        </span>
        <span className="gold-rule mt-0.5 flex-1" aria-hidden />
      </div>

      <div className="relative">
        {/* 그라데이션 타임라인 레일 — 점 열을 따라 흐른다. */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-6 left-[6.75rem] top-6 w-px bg-gradient-to-b from-gold/10 via-gold/40 to-aqua/30"
        />
        <ol data-testid="timeline-list" className="relative flex flex-col gap-1">
          {sorted.map((item) => (
            <TimelineItem
              key={item.id}
              item={item}
              status={getItemStatus(item, day, day.items, now)}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
