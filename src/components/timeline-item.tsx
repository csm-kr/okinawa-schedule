// 타임라인 개별 항목 — status(past/current/upcoming)별 시각 규칙(DESIGN_GUIDE).
// past=ink-muted+빈 점, current=좌측 coral 바+굵게+큰 글씨+"지금" 뱃지+채운 점, upcoming=ink+테두리 점.
import type { ItemStatus, ScheduleItem } from '@/types/itinerary';

type Props = {
  item: ScheduleItem;
  status: ItemStatus;
};

// 상태별 타임라인 점 — past=속 빈 회색, current=빛나는 코랄, upcoming=골드 테두리.
const dotClass: Record<ItemStatus, string> = {
  past: 'border-2 border-ink-muted/60 bg-night-soft',
  current: 'border-2 border-coral bg-sunset-gradient shadow-glow-coral',
  upcoming: 'border-2 border-gold/70 bg-night-soft',
};

export function TimelineItem({ item, status }: Props) {
  const isCurrent = status === 'current';
  const isPast = status === 'past';

  return (
    <li
      data-status={status}
      className={[
        'group relative flex gap-3 rounded-2xl py-3 pl-1 pr-1 transition-colors',
        isCurrent
          ? 'bg-white/[0.07] shadow-glow-coral ring-1 ring-coral/30'
          : 'hover:bg-white/[0.03]',
        isPast ? 'opacity-65' : '',
      ].join(' ')}
    >
      <time
        className={[
          'tabular-nums text-time w-[5rem] shrink-0 pt-0.5 text-right',
          isCurrent ? 'font-extrabold time-now' : isPast ? 'text-ink-muted' : 'text-gold',
        ].join(' ')}
      >
        {item.startTime}
        {item.endTime ? (
          <span className="block text-meta font-medium tabular-nums text-ink-muted">
            –{item.endTime}
          </span>
        ) : null}
      </time>

      <span aria-hidden className="flex w-6 shrink-0 flex-col items-center pt-2">
        <span
          className={[
            'block rounded-full',
            isCurrent ? 'h-4 w-4 animate-pulse-glow' : 'h-3 w-3',
            dotClass[status],
          ].join(' ')}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={[
            'flex flex-wrap items-center gap-x-2 gap-y-1',
            isCurrent ? 'text-time font-extrabold text-ink' : 'text-title',
            isPast ? 'text-ink-muted' : 'text-ink',
          ].join(' ')}
        >
          <span className="[word-break:keep-all]">{item.title}</span>
          {isCurrent && (
            <span className="flex items-center gap-1 rounded-full bg-sunset-gradient px-2.5 py-0.5 text-meta font-bold text-night-deep shadow-glow-coral">
              <span className="live-dot !bg-night-deep" aria-hidden />
              지금
              <span aria-hidden className="animate-pulse">✨</span>
            </span>
          )}
          {item.url && (
            // 보기엔 작은 🔗 지만 탭 영역은 48px 이상으로(R8 접근성). 새 탭으로 연다.
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="지도에서 열기"
              className="-my-2 ml-auto inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-full text-title transition-colors hover:bg-white/10"
            >
              <span aria-hidden>🔗</span>
            </a>
          )}
        </p>
        {item.location && (
          <p
            className={[
              'mt-0.5 flex items-center gap-1.5 text-body',
              isPast ? 'text-ink-muted' : 'text-ink/90',
            ].join(' ')}
          >
            <span aria-hidden className="text-aqua">
              ◍
            </span>
            {item.location}
          </p>
        )}
        {item.note && <p className="mt-0.5 text-meta text-ink-muted">{item.note}</p>}
      </div>
    </li>
  );
}
