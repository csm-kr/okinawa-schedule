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
    <ol data-testid="timeline-list" className="flex flex-col">
      {sorted.map((item) => (
        <TimelineItem key={item.id} item={item} status={getItemStatus(item, day, day.items, now)} />
      ))}
    </ol>
  );
}
