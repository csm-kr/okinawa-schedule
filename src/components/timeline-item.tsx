// 타임라인 개별 항목 — status(past/current/upcoming)별 시각 규칙(DESIGN_GUIDE).
// past=ink-muted+빈 점, current=좌측 coral 바+굵게+큰 글씨+"지금" 뱃지+채운 점, upcoming=ink+테두리 점.
import type { ItemStatus, ScheduleItem } from '@/types/itinerary';

type Props = {
  item: ScheduleItem;
  status: ItemStatus;
};

const dotClass: Record<ItemStatus, string> = {
  past: 'border-2 border-ink-muted bg-transparent',
  current: 'border-2 border-coral bg-coral',
  upcoming: 'border-2 border-ink bg-transparent',
};

export function TimelineItem({ item, status }: Props) {
  const isCurrent = status === 'current';
  const isPast = status === 'past';

  return (
    <li
      data-status={status}
      className={[
        'flex gap-3 py-3 pl-3',
        isCurrent ? 'border-l-4 border-coral bg-surface rounded-r-xl' : 'border-l-4 border-transparent',
      ].join(' ')}
    >
      <time
        className={[
          'tabular-nums text-time w-[5.5rem] shrink-0 pt-0.5',
          isPast ? 'text-ink-muted' : 'text-ink',
          isCurrent ? 'font-bold' : '',
        ].join(' ')}
      >
        {item.startTime}
        {item.endTime ? `–${item.endTime}` : ''}
      </time>

      <span aria-hidden className="flex flex-col items-center pt-2">
        <span className={`block h-3 w-3 rounded-full ${dotClass[status]}`} />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={[
            'flex items-center gap-2',
            isCurrent ? 'text-time font-bold text-ink' : 'text-title',
            isPast ? 'text-ink-muted' : 'text-ink',
          ].join(' ')}
        >
          <span>{item.title}</span>
          {isCurrent && (
            <span className="rounded-full bg-coral px-2 py-0.5 text-meta font-semibold text-white">
              지금
            </span>
          )}
          {item.url && (
            // 보기엔 작은 🔗 지만 탭 영역은 48px 이상으로(R8 접근성). 새 탭으로 연다.
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="지도에서 열기"
              className="-my-2 ml-auto inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center text-title"
            >
              <span aria-hidden>🔗</span>
            </a>
          )}
        </p>
        {item.location && (
          <p className={`text-body ${isPast ? 'text-ink-muted' : 'text-ink'}`}>{item.location}</p>
        )}
        {item.note && <p className="text-meta text-ink-muted">{item.note}</p>}
      </div>
    </li>
  );
}
