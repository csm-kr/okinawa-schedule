// 한 day 의 항목을 startTime 오름차순으로 렌더. 상태(past/current/upcoming)는
// getItemStatus 로 now(KST) 기준 계산한다(R7). 데이터 접근 없음 — 순수 표현.
import type { Day } from '@/types/itinerary';
import { getItemStatus, isInNowBlock } from '@/lib/status';
import { routeNumberById } from '@/lib/map';
import { TimelineItem, type NowBlockPos } from './timeline-item';

// 연속한 블록 항목들을 하나의 음영 띠로: 양 끝은 둥글게(top/bottom), 혼자면 solo.
function blockPos(flags: boolean[], i: number): NowBlockPos | undefined {
  if (!flags[i]) return undefined;
  const prev = flags[i - 1] ?? false;
  const next = flags[i + 1] ?? false;
  if (prev && next) return 'mid';
  if (prev) return 'bottom';
  if (next) return 'top';
  return 'solo';
}

type Props = {
  day: Day;
  now: Date;
};

export function TimelineList({ day, now }: Props) {
  const sorted = [...day.items].sort((a, b) => a.startTime.localeCompare(b.startTime));
  // 좌표 있는 항목 → 아래 지도 마커와 같은 번호(없는 항목은 undefined).
  const numberById = routeNumberById(day);
  // 현재 시각이 든 시간대 블록(±60분) 항목들 — 연속 구간을 하나의 음영 띠로 묶는다.
  const blockFlags = sorted.map((it) => isInNowBlock(it, day, day.items, now));

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
          {sorted.map((item, i) => (
            <TimelineItem
              key={item.id}
              item={item}
              status={getItemStatus(item, day, day.items, now)}
              number={numberById.get(item.id)}
              nowBlock={blockPos(blockFlags, i)}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
