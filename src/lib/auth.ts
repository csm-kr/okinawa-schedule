// 관리자 인증 — 공용 비밀번호 상수시간 비교 + HMAC 서명 세션 쿠키(SECURITY.md / R3·R4).
// 비밀(ADMIN_PASSWORD·ADMIN_COOKIE_SECRET)은 서버 전용. 클라이언트에서 import 금지.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// 쿠키 이름만 공유하고 httpOnly·Secure·SameSite 속성은 route 가 설정한다.
export const SESSION_COOKIE_NAME = "admin_session";

function cookieSecret(): string {
  return process.env.ADMIN_COOKIE_SECRET ?? "";
}

// 상수시간 비교. 두 입력을 각각 sha256 으로 고정 길이(32B) 해시한 뒤 비교해
// 길이 차이로 인한 timing 누출과 timingSafeEqual 의 길이 불일치 throw 를 모두 피한다.
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  return createHmac("sha256", cookieSecret()).update(payload).digest("hex");
}

// 쿠키 값 = "{발급시각}.{HMAC 서명}". 만료는 route 의 Max-Age 로 관리한다.
export function createSessionCookie(): string {
  const payload = String(Date.now());
  return `${payload}.${sign(payload)}`;
}

export function verifySessionCookie(value: string | undefined): boolean {
  if (!value) return false;
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
