// 저장소 추상화 계약 — KV 접근은 이 인터페이스 뒤로만 한다(R1·R2). 직접 Redis 호출 금지.

import type { Itinerary } from "@/types/itinerary";

export interface ItineraryStore {
  get(): Promise<Itinerary | null>;
  // 낙관적 동시성(R5): expectedVersion 이 현재 version 과 다르면 throw.
  // 성공 시 version+1·updatedAt 을 갱신한 문서를 반환한다.
  put(next: Itinerary, expectedVersion: number): Promise<Itinerary>;
}

// version 불일치 시 던지는 충돌 에러. route 가 잡아 409 로 매핑한다.
export class VersionConflictError extends Error {
  constructor(
    public readonly expected: number,
    public readonly actual: number,
  ) {
    super(`version 충돌: expected ${expected}, actual ${actual}`);
    this.name = "VersionConflictError";
  }
}
