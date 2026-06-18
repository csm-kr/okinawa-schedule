// 날짜 탭(세그먼트) — 큰 터치 타깃(≥48px), 선택 탭은 굵게+밑줄+coral-strong 로 뚜렷이(R8).
// 살구는 면(밑줄)에만, 글자는 coral-strong 로 대비 보강.
'use client';

import type { Day } from '@/types/itinerary';

type Props = {
  days: Day[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function shortDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function DayTabs({ days, selectedId, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="날짜 선택"
      className="glass animate-fade-up flex gap-1.5 rounded-2xl p-1.5 shadow-glass"
    >
      {days.map((day) => {
        const selected = day.id === selectedId;
        return (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(day.id)}
            className={[
              'min-h-12 flex-1 rounded-xl px-3 py-2 text-body transition-all duration-300',
              selected
                ? 'bg-gold-gradient font-bold text-night-deep shadow-glow-gold'
                : 'font-medium text-ink/80 hover:bg-white/5 hover:text-ink',
            ].join(' ')}
          >
            <span className="block leading-tight">{day.label}</span>
            <span
              className={[
                'block text-meta tabular-nums',
                selected ? 'text-night-deep/70' : 'text-ink-muted',
              ].join(' ')}
            >
              {shortDate(day.date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
