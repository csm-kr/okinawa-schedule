import { describe, it, expect, vi } from 'vitest';
import type { Redis } from '@upstash/redis';
import { UpstashStore } from './upstash';
import { VersionConflictError } from './types';
import type { Itinerary } from '@/types/itinerary';

function makeItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  return {
    title: '환갑잔치',
    timezone: 'Asia/Seoul',
    version: 0,
    updatedAt: '2026-09-01T00:00:00.000Z',
    days: [],
    ...overrides,
  };
}

// 실제 Upstash 네트워크 대신 get/set 만 가진 가짜 Redis 를 주입한다(오프라인 검증).
function fakeRedis(initial: Itinerary | null = null) {
  let store: Itinerary | null = initial;
  return {
    get: vi.fn(async () => store),
    set: vi.fn(async (_key: string, value: Itinerary) => {
      store = value;
      return 'OK';
    }),
  };
}

describe('UpstashStore', () => {
  it('초기(키 없음)에는 null 을 반환한다', async () => {
    const redis = fakeRedis(null);
    const store = new UpstashStore(redis as unknown as Redis);
    expect(await store.get()).toBeNull();
    expect(redis.get).toHaveBeenCalledWith('itinerary');
  });

  it('put 은 key "itinerary" 에 JSON 을 set 하고 version+1·updatedAt 갱신', async () => {
    const redis = fakeRedis(null);
    const store = new UpstashStore(redis as unknown as Redis);
    const saved = await store.put(makeItinerary({ title: '저장본' }), 0);
    expect(saved.version).toBe(1);
    expect(saved.title).toBe('저장본');
    expect(redis.set).toHaveBeenCalledWith('itinerary', saved);
    // 라운드트립: 같은 가짜 저장소에서 다시 읽힌다.
    expect((await store.get())?.title).toBe('저장본');
  });

  it('expectedVersion 불일치 시 VersionConflictError 를 던지고 set 하지 않는다', async () => {
    const redis = fakeRedis(makeItinerary({ version: 3 }));
    const store = new UpstashStore(redis as unknown as Redis);
    await expect(store.put(makeItinerary(), 0)).rejects.toBeInstanceOf(VersionConflictError);
    expect(redis.set).not.toHaveBeenCalled();
  });
});
