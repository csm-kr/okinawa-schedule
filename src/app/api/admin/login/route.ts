// 공용 비밀번호 검증(상수시간) → 서명 httpOnly 세션 쿠키 발급(SECURITY.md / R4).

import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  createSessionCookie,
  verifyPassword,
} from "@/lib/auth";

const LoginSchema = z.object({ password: z.string().min(1) });

const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7일

// HTTPS 요청일 때만 Secure 를 붙인다. 프로덕션(Vercel)은 항상 HTTPS 라 Secure 가 켜지고,
// 로컬·E2E 의 http://localhost 에서는 빠진다(WebKit 은 http 에서 Secure 쿠키를 버리기 때문).
function isHttps(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  if (!verifyPassword(parsed.data.password)) {
    return Response.json({ error: "비밀번호가 달라요" }, { status: 401 });
  }

  const cookie = createSessionCookie();
  const parts = [
    `${SESSION_COOKIE_NAME}=${cookie}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SEC}`,
  ];
  if (isHttps(request)) parts.push("Secure");
  const setCookie = parts.join("; ");

  return Response.json(
    { data: { ok: true } },
    { status: 200, headers: { "Set-Cookie": setCookie } },
  );
}
