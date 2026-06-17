// 일정 항목 상태·현재/다음 항목·행사 단계 계산. 모두 Asia/Seoul(tz-aware) 기준 순수 함수(R7).

import type { Day, EventPhase, Itinerary, ItemStatus, ScheduleItem } from "@/types/itinerary";
import { combineKst } from "./time";

const DEFAULT_DURATION_MIN = 60;

// startTime 오름차순으로 정렬한 사본.
function sortByStart(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// 항목의 종료 경계: endTime 있으면 그 시각, 없으면 같은 day 의 다음 item.startTime,
// 마지막 item 이면 시작+60분.
function itemEnd(item: ScheduleItem, day: Day, dayItems: ScheduleItem[]): Date {
  if (item.endTime) return combineKst(day.date, item.endTime);
  const sorted = sortByStart(dayItems);
  const idx = sorted.findIndex((it) => it.id === item.id);
  const next = sorted[idx + 1];
  if (next) return combineKst(day.date, next.startTime);
  const start = combineKst(day.date, item.startTime);
  return new Date(start.getTime() + DEFAULT_DURATION_MIN * 60_000);
}

// now < 시작 → upcoming, 시작 ≤ now < 종료 → current, now ≥ 종료 → past.
export function getItemStatus(
  item: ScheduleItem,
  day: Day,
  dayItems: ScheduleItem[],
  now: Date,
): ItemStatus {
  const start = combineKst(day.date, item.startTime).getTime();
  const end = itemEnd(item, day, dayItems).getTime();
  const t = now.getTime();
  if (t < start) return "upcoming";
  if (t < end) return "current";
  return "past";
}

type Entry = { item: ScheduleItem; day: Day };

// 모든 day 의 항목을 절대 시작 시각 오름차순으로 평탄화.
function flatten(itinerary: Itinerary): Entry[] {
  const entries: Entry[] = [];
  for (const day of itinerary.days) {
    for (const item of day.items) entries.push({ item, day });
  }
  return entries.sort(
    (a, b) =>
      combineKst(a.day.date, a.item.startTime).getTime() -
      combineKst(b.day.date, b.item.startTime).getTime(),
  );
}

// day 경계를 넘어 현재 진행 항목과 가장 가까운 다음 항목을 찾는다.
export function findCurrentAndNext(
  itinerary: Itinerary,
  now: Date,
): { current?: Entry; next?: Entry } {
  let current: Entry | undefined;
  let next: Entry | undefined;
  for (const entry of flatten(itinerary)) {
    const status = getItemStatus(entry.item, entry.day, entry.day.items, now);
    if (status === "current" && !current) current = entry;
    if (status === "upcoming" && !next) next = entry; // 시간순 첫 upcoming = 가장 가까운 다음
  }
  return { current, next };
}

// 전체 행사 기준: 첫 시작 전 → before, 사이 → during, 마지막 종료 후 → after.
export function getEventPhase(itinerary: Itinerary, now: Date): EventPhase {
  const entries = flatten(itinerary);
  if (entries.length === 0) return "before";
  const t = now.getTime();
  const firstStart = combineKst(
    entries[0].day.date,
    entries[0].item.startTime,
  ).getTime();
  const lastEnd = Math.max(
    ...entries.map((e) => itemEnd(e.item, e.day, e.day.items).getTime()),
  );
  if (t < firstStart) return "before";
  if (t >= lastEnd) return "after";
  return "during";
}
