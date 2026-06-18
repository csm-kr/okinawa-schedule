// 일정 도메인 타입 — 단일 진실 공급원(docs/dev/DB.md). 화면·저장소가 모두 이 타입을 따른다.

export type ItemStatus = "past" | "current" | "upcoming";

export type ScheduleItem = {
  id: string;
  startTime: string; // "HH:mm" (해당 day.date 기준, KST)
  endTime?: string; // 선택
  title: string;
  location?: string; // 텍스트만
  note?: string;
  url?: string; // 외부 링크(http/https) — 🔗 새 탭으로 열기
  lat?: number; // 위도 — 동선 지도용(좌표 없으면 지도에 안 뜸)
  lng?: number; // 경도
};

export type Day = {
  id: string;
  date: string; // ISO date "2026-09-19"
  label: string; // "1일차"
  items: ScheduleItem[];
};

export type Itinerary = {
  title: string;
  subtitle?: string;
  timezone: "Asia/Seoul";
  version: number; // 낙관적 동시성 — 저장 시 +1
  updatedAt: string; // ISO datetime
  days: Day[];
};

// 전체 행사 기준 현재 시각의 위치: 시작 전 / 진행 중 / 종료 후
export type EventPhase = "before" | "during" | "after";
