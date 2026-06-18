// 공개 타임라인의 클라이언트 래퍼 — 서버가 읽은 일정을 받아 "지금" 강조를 useNow 로 갱신하고,
// 날짜 탭 선택 상태를 관리한다. 데이터 접근 없음(서버 전용, R1). 빈 상태도 여기서 처리.
'use client';

import { useMemo, useState } from 'react';
import type { Itinerary } from '@/types/itinerary';
import { useNow } from './use-now';
import { StatusCard } from './status-card';
import { DayTabs } from './day-tabs';
import { TimelineList } from './timeline-list';
import { DayMap } from './day-map';

type Props = {
  itinerary: Itinerary | null;
  initialDayId?: string;
};

export function TimelineView({ itinerary, initialDayId }: Props) {
  const hasItems = useMemo(
    () => !!itinerary && itinerary.days.some((d) => d.items.length > 0),
    [itinerary],
  );
  const [selectedId, setSelectedId] = useState(() => initialDayId ?? itinerary?.days[0]?.id ?? '');
  const now = useNow();

  if (!itinerary || !hasItems) {
    return (
      <p className="px-4 py-16 text-center text-body text-ink-muted">아직 등록된 일정이 없어요</p>
    );
  }

  const selectedDay =
    itinerary.days.find((d) => d.id === selectedId) ?? itinerary.days[0];

  return (
    <div className="flex flex-col gap-5">
      <StatusCard itinerary={itinerary} now={now} />
      <DayTabs days={itinerary.days} selectedId={selectedDay.id} onSelect={setSelectedId} />
      <TimelineList day={selectedDay} now={now} />
      <DayMap day={selectedDay} />
    </div>
  );
}
