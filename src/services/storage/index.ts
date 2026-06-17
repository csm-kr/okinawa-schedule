// 저장소 선택 진입점. STORAGE_DRIVER 로 Memory/Upstash 구현을 고른다(ENV.md).
// 클라이언트에서 import 금지 — 서버(Server Component·route handler) 전용(R1).

import { Redis } from "@upstash/redis";
import type { ItineraryStore } from "./types";
import { MemoryStore } from "./memory";
import { UpstashStore } from "./upstash";

// memory 드라이버는 프로세스 수명 동안 상태를 유지해야 하므로 단일 인스턴스로 캐시한다
// (요청 간 PUT→GET 반영).
let memoryInstance: MemoryStore | null = null;

export function getStore(): ItineraryStore {
  const driver = process.env.STORAGE_DRIVER ?? "memory";

  if (driver === "upstash") {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        "STORAGE_DRIVER=upstash 이지만 UPSTASH_REDIS_REST_URL/TOKEN 이 설정되지 않았습니다.",
      );
    }
    return new UpstashStore(new Redis({ url, token }));
  }

  if (!memoryInstance) memoryInstance = new MemoryStore();
  return memoryInstance;
}
