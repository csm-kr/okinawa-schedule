// Upstash Redis 구현 — key "itinerary" 에 JSON 단일 문서. 낙관적 동시성은 MemoryStore 와 동일.
// Redis 인스턴스는 주입받는다(테스트는 가짜 주입, 실제 연결은 index.ts 가 env 로 구성).

import type { Redis } from "@upstash/redis";
import type { Itinerary } from "@/types/itinerary";
import type { ItineraryStore } from "./types";
import { VersionConflictError } from "./types";

const KEY = "itinerary";

export class UpstashStore implements ItineraryStore {
  constructor(private readonly redis: Redis) {}

  async get(): Promise<Itinerary | null> {
    return (await this.redis.get<Itinerary>(KEY)) ?? null;
  }

  async put(next: Itinerary, expectedVersion: number): Promise<Itinerary> {
    const current = await this.redis.get<Itinerary>(KEY);
    const currentVersion = current?.version ?? 0;
    if (currentVersion !== expectedVersion) {
      throw new VersionConflictError(expectedVersion, currentVersion);
    }
    const saved: Itinerary = {
      ...next,
      version: currentVersion + 1,
      updatedAt: new Date().toISOString(),
    };
    await this.redis.set(KEY, saved);
    return saved;
  }
}
