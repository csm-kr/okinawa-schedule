// 공용 비밀번호 검증(상수시간) → 서명 httpOnly 세션 쿠키 발급(SECURITY.md / R4).

import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  createSessionCookie,
  verifyPassword,
} from "@/lib/auth";

const LoginSchema = z.object({ password: z.string().min(1) });

const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7일

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
  const setCookie = [
    `${SESSION_COOKIE_NAME}=${cookie}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SEC}`,
  ].join("; ");

  return Response.json(
    { data: { ok: true } },
    { status: 200, headers: { "Set-Cookie": setCookie } },
  );
}
