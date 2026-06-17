import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLogin } from './admin-login';

// next/navigation 의 useRouter 를 모킹 — 성공 시 router.refresh 로 서버 재렌더를 트리거한다.
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

describe('AdminLogin', () => {
  beforeEach(() => {
    refresh.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('"가족 비밀번호" 라벨과 56px(h-14) "들어가기" 버튼을 렌더한다', () => {
    render(<AdminLogin />);
    expect(screen.getByLabelText('가족 비밀번호')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: '들어가기' });
    expect(button.className).toMatch(/h-14/); // 3.5rem = 56px (R8)
  });

  it('올바른 비밀번호면 login 을 POST 하고 router.refresh 로 화면을 갱신한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminLogin />);
    fireEvent.change(screen.getByLabelText('가족 비밀번호'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: '들어가기' }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/login',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ password: 'secret' }) }),
    );
  });

  it('틀린 비밀번호면 "비밀번호가 달라요" 를 보여주고 입력칸을 흔든다(refresh 안 함)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminLogin />);
    fireEvent.change(screen.getByLabelText('가족 비밀번호'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: '들어가기' }));

    expect(await screen.findByText('비밀번호가 달라요')).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByLabelText('가족 비밀번호').className).toMatch(/animate-shake/);
  });
});
