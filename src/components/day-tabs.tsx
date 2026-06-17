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
    <div role="tablist" aria-label="날짜 선택" className="flex gap-2 border-b border-line">
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
              'min-h-12 flex-1 px-3 pb-2 pt-2 text-body',
              '-mb-px border-b-[3px]',
              selected
                ? 'border-coral font-bold text-coral-strong'
                : 'border-transparent text-ink',
            ].join(' ')}
          >
            <span className="block">{day.label}</span>
            <span className="block text-meta text-ink-muted">{shortDate(day.date)}</span>
          </button>
        );
      })}
    </div>
  );
}
