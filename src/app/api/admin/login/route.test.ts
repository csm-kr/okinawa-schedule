import { describe, it, expect, beforeAll } from 'vitest';
import { POST } from './route';
import { SESSION_COOKIE_NAME, verifySessionCookie } from '@/lib/auth';

function loginRequest(body: unknown): Request {
  return new Request('http://localhost/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeAll(() => {
  process.env.ADMIN_PASSWORD = 'family-secret';
  process.env.ADMIN_COOKIE_SECRET = 'a-long-random-cookie-signing-secret';
});

describe('POST /api/admin/login', () => {
  it('비밀번호가 맞으면 200 + { data:{ok:true} } 와 서명 httpOnly Set-Cookie', async () => {
    const res = await POST(loginRequest({ password: 'family-secret' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ data: { ok: true } });

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite/i);

    // 발급된 쿠키 값이 검증을 통과해야 한다(서명 유효).
    const value = /admin_session=([^;]+)/.exec(setCookie ?? '')?.[1];
    expect(verifySessionCookie(value)).toBe(true);
  });

  it('비밀번호가 틀리면 401, Set-Cookie 없음', async () => {
    const res = await POST(loginRequest({ password: 'wrong' }));
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('password 가 없으면 400', async () => {
    const res = await POST(loginRequest({ nope: true }));
    expect(res.status).toBe(400);
  });
});
