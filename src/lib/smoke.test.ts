import { describe, it, expect } from 'vitest';

// 스모크: Vitest 검증 하니스가 동작하는지 확인하는 자명한 단언.
const add = (a: number, b: number): number => a + b;

describe('smoke', () => {
  it('Vitest 하니스가 동작한다', () => {
    expect(add(2, 2)).toBe(4);
  });
});
