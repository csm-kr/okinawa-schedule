import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNow } from './use-now';

afterEach(() => {
  vi.useRealTimers();
});

describe('useNow', () => {
  it('마운트 시 현재 시각(Date)을 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-19T09:00:00Z'));
    const { result } = renderHook(() => useNow(30_000));
    expect(result.current).toBeInstanceOf(Date);
    expect(result.current.getTime()).toBe(new Date('2026-09-19T09:00:00Z').getTime());
  });

  it('지정한 간격마다 현재 시각을 다시 읽어 갱신한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-19T09:00:00Z'));
    const { result } = renderHook(() => useNow(30_000));
    const first = result.current.getTime();

    // 30초 경과 → 인터벌이 한 번 발화하며 그 시점의 시각을 다시 읽는다.
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current.getTime()).toBeGreaterThan(first);
    expect(result.current.getTime()).toBe(new Date('2026-09-19T09:00:30Z').getTime());
  });

  it('언마운트 시 인터벌을 정리한다', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useNow(30_000));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
