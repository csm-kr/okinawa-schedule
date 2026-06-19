import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from './route';
import { SESSION_COOKIE_NAME, createSessionCookie } from '@/lib/auth';

const ORIGINAL = { ...process.env };

function makeReq(body: unknown, authed = true): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (authed) headers.cookie = `${SESSION_COOKIE_NAME}=${createSessionCookie()}`;
  return new Request('http://localhost/api/resolve-map', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/resolve-map', () => {
  beforeEach(() => {
    process.env.ADMIN_COOKIE_SECRET = 'test-secret';
  });
  afterEach(() => {
    process.env = { ...ORIGINAL };
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('인증 쿠키가 없으면 401', async () => {
    const res = await POST(makeReq({ url: 'https://www.google.com/maps/@26.2,127.6,17z' }, false));
    expect(res.status).toBe(401);
  });

  it('url 이 없으면 400', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('전체 URL 은 fetch 없이 바로 좌표를 추출한다', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(makeReq({ url: 'https://www.google.com/maps/@26.2124,127.6792,17z' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { lat: 26.2124, lng: 127.6792 } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('단축링크는 리다이렉트를 펼쳐 좌표를 얻는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        url: 'https://www.google.com/maps/place/X/@26.5,127.9,17z/data=!3d26.5!4d127.9',
        text: async () => '',
      })),
    );
    const res = await POST(makeReq({ url: 'https://maps.app.goo.gl/abc123' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { lat: 26.5, lng: 127.9 } });
  });

  it('좌표 없는 비구글 링크는 fetch 하지 않고 400 (SSRF 차단)', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(makeReq({ url: 'https://evil.example.com/internal-secret' }));
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('펼쳐도 좌표가 없으면 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        url: 'https://www.google.com/maps',
        text: async () => '<html>no coords here</html>',
      })),
    );
    const res = await POST(makeReq({ url: 'https://maps.app.goo.gl/nope' }));
    expect(res.status).toBe(404);
  });
});
