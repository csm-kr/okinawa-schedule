import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { SwRegister } from './sw-register';

// 각 테스트 사이 navigator.serviceWorker 스텁을 정리한다(다음 테스트의 미지원 분기 보장).
afterEach(() => {
  if ('serviceWorker' in navigator) {
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
  }
  vi.restoreAllMocks();
});

describe('SwRegister', () => {
  it('마운트되면 /sw.js 를 등록한다', () => {
    const register = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });

    render(<SwRegister />);

    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('serviceWorker 미지원 환경에서는 등록을 시도하지 않고 에러도 던지지 않는다', () => {
    // jsdom navigator 에는 serviceWorker 가 없다(미지원 분기).
    expect('serviceWorker' in navigator).toBe(false);
    expect(() => render(<SwRegister />)).not.toThrow();
  });

  it('아무것도 렌더링하지 않는다(null)', () => {
    const { container } = render(<SwRegister />);
    expect(container).toBeEmptyDOMElement();
  });
});
