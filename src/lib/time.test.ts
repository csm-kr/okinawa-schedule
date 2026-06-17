import { describe, it, expect } from 'vitest';
import { combineKst } from './time';

// combineKst 는 "YYYY-MM-DD" + "HH:mm" 을 Asia/Seoul 벽시계로 해석해 절대 시각(Date)을 만든다.
// 검증은 toISOString()(항상 UTC 출력)으로 한다 — 로컬 tz 파싱에 의존했다면 비-KST 머신에서 값이 틀어진다(R7).
describe('combineKst', () => {
  it('KST(UTC+9) 기준으로 합성한다: 18:00 KST = 09:00 UTC', () => {
    expect(combineKst('2026-09-19', '18:00').toISOString()).toBe('2026-09-19T09:00:00.000Z');
  });

  it('자정은 전날 15:00 UTC 로 합성한다', () => {
    expect(combineKst('2026-09-19', '00:00').toISOString()).toBe('2026-09-18T15:00:00.000Z');
  });

  it('기기 로컬 tz 와 무관하게 동일한 절대 시각을 만든다 (R7): 09:30 KST = 00:30 UTC', () => {
    expect(combineKst('2026-09-20', '09:30').toISOString()).toBe('2026-09-20T00:30:00.000Z');
  });
});
