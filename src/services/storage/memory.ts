// 인메모리 ItineraryStore — 로컬 개발·테스트용(네트워크 없음). 낙관적 동시성은 Upstash 와 동일.

import type { Itinerary } from "@/types/itinerary";
import type { ItineraryStore } from "./types";
import { VersionConflictError } from "./types";

export class MemoryStore implements ItineraryStore {
  private data: Itinerary | null;

  constructor(initial: Itinerary | null = null) {
    this.data = initial;
  }

  async get(): Promise<Itinerary | null> {
    return this.data;
  }

  async put(next: Itinerary, expectedVersion: number): Promise<Itinerary> {
    const currentVersion = this.data?.version ?? 0;
    if (currentVersion !== expectedVersion) {
      throw new VersionConflictError(expectedVersion, currentVersion);
    }
    const saved: Itinerary = {
      ...next,
      version: currentVersion + 1,
      updatedAt: new Date().toISOString(),
    };
    this.data = saved;
    return saved;
  }
}
