import { describe, it, expect } from 'vitest';
import { MemoryStore } from './memory';
import { VersionConflictError } from './types';
import type { Itinerary } from '@/types/itinerary';

// 최소 유효 문서. version 0 = 아직 한 번도 저장 안 된 초기 상태.
function makeItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  return {
    title: '칠순잔치',
    timezone: 'Asia/Seoul',
    version: 0,
    updatedAt: '2026-09-01T00:00:00.000Z',
    days: [],
    ...overrides,
  };
}

describe('MemoryStore', () => {
  it('초기 상태는 null 을 반환한다', async () => {
    const store = new MemoryStore();
    expect(await store.get()).toBeNull();
  });

  it('put → get 라운드트립: 저장한 문서를 다시 읽는다', async () => {
    const store = new MemoryStore();
    const saved = await store.put(makeItinerary({ title: '저장본' }), 0);
    const got = await store.get();
    expect(got?.title).toBe('저장본');
    expect(got).toEqual(saved);
  });

  it('put 성공 시 version+1·updatedAt 을 갱신한다', async () => {
    const store = new MemoryStore();
    const before = '2026-09-01T00:00:00.000Z';
    const saved = await store.put(makeItinerary({ updatedAt: before }), 0);
    expect(saved.version).toBe(1);
    expect(saved.updatedAt).not.toBe(before);
    expect(Number.isNaN(Date.parse(saved.updatedAt))).toBe(false);

    // 연속 저장: 현재 version(1)로 기대하면 2 가 된다.
    const next = await store.put(makeItinerary(), 1);
    expect(next.version).toBe(2);
  });

  it('expectedVersion 이 현재 version 과 다르면 VersionConflictError 를 던진다', async () => {
    const store = new MemoryStore();
    await store.put(makeItinerary(), 0); // version → 1
    await expect(store.put(makeItinerary(), 0)).rejects.toBeInstanceOf(VersionConflictError);
    // 충돌 후에도 기존 데이터는 보존된다(덮어쓰지 않음, R5).
    expect((await store.get())?.version).toBe(1);
  });
});
