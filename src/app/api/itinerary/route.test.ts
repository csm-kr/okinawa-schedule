import { describe, it, expect, beforeAll, vi } from 'vitest';
import { GET, PUT } from './route';
import { SESSION_COOKIE_NAME, createSessionCookie } from '@/lib/auth';
import type { Itinerary } from '@/types/itinerary';

// revalidatePath 는 Next 런타임 밖에서 호출되므로 모킹한다(저장 성공 시 호출 검증).
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { revalidatePath } from 'next/cache';

function makeItinerary(version: number): Itinerary {
  return {
    title: '환갑잔치',
    timezone: 'Asia/Seoul',
    version,
    updatedAt: '2026-09-01T00:00:00.000Z',
    days: [
      {
        id: 'd1',
        date: '2026-09-19',
        label: '1일차',
        items: [{ id: 'i1', startTime: '18:00', title: '가족 만찬' }],
      },
    ],
  };
}

function authCookie(): string {
  return `${SESSION_COOKIE_NAME}=${createSessionCookie()}`;
}

function putRequest(body: unknown, opts: { cookie?: string } = {}): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.cookie) headers.cookie = opts.cookie;
  return new Request('http://localhost/api/itinerary', {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
}

// 현재 저장된 version(없으면 0)을 읽어 테스트를 순서 독립적으로 만든다.
async function currentVersion(): Promise<number> {
  const res = await GET();
  const json = (await res.json()) as { data: Itinerary | null };
  return json.data?.version ?? 0;
}

beforeAll(() => {
  process.env.STORAGE_DRIVER = 'memory';
  process.env.ADMIN_PASSWORD = 'family-secret';
  process.env.ADMIN_COOKIE_SECRET = 'a-long-random-cookie-signing-secret';
});

describe('GET /api/itinerary', () => {
  it('200 으로 { data } 형태를 반환한다(공개)', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('data');
  });
});

describe('PUT /api/itinerary', () => {
  it('쿠키가 없으면 401', async () => {
    const res = await PUT(putRequest({ itinerary: makeItinerary(0), expectedVersion: 0 }));
    expect(res.status).toBe(401);
  });

  it('쿠키가 무효(위조)면 401', async () => {
    const res = await PUT(
      putRequest(
        { itinerary: makeItinerary(0), expectedVersion: 0 },
        { cookie: `${SESSION_COOKIE_NAME}=forged.signature` },
      ),
    );
    expect(res.status).toBe(401);
  });

  it('인증돼도 본문이 스키마에 안 맞으면 400', async () => {
    const res = await PUT(putRequest({ nope: true }, { cookie: authCookie() }));
    expect(res.status).toBe(400);
  });

  it('인증 + 올바른 expectedVersion 이면 200, version+1 저장 후 revalidatePath 호출', async () => {
    const v = await currentVersion();
    const res = await PUT(
      putRequest({ itinerary: makeItinerary(v), expectedVersion: v }, { cookie: authCookie() }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: Itinerary };
    expect(json.data.version).toBe(v + 1);
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('expectedVersion 이 현재와 다르면 409', async () => {
    const v = await currentVersion();
    const res = await PUT(
      putRequest(
        { itinerary: makeItinerary(v), expectedVersion: v + 999 },
        { cookie: authCookie() },
      ),
    );
    expect(res.status).toBe(409);
  });
});
