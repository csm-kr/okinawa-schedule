'use client';

// 라이브 "지금" 강조용 시계 훅 — 일정 시간 흐름에 맞춰 현재 시각을 주기적으로 다시 읽는다.
// 데이터 refetch 가 아니라 가벼운 재렌더 트리거다(ARCHITECTURE 데이터 흐름).
import { useEffect, useState } from 'react';

export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
