// admin 전용 — 구글맵 링크에서 좌표를 추출한다. 전체 URL 이면 문자열에서 바로 파싱하고,
// 단축링크면 리다이렉트를 펼친다. fetch 는 구글 소유 호스트로만 제한한다(SSRF 차단, SECURITY.md).
import { z } from "zod";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";
import { parseLatLngFromMapUrl } from "@/lib/map";

const BodySchema = z.object({ url: z.string().url() });

// 요청 헤더에서 세션 쿠키 값을 직접 읽는다(테스트가 Request 로 직접 호출 가능).
function readSessionCookie(request: Request): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) return rest.join("=");
  }
  return undefined;
}

// 구글이 소유한 호스트만 네트워크로 펼친다(임의 URL fetch = SSRF 방지).
function isGoogleHost(host: string): boolean {
  return (
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host === "g.co" ||
    host === "google.com" ||
    host.endsWith(".google.com")
  );
}

export async function POST(request: Request): Promise<Response> {
  // 1) 인증(R3) — admin 쿠키 검증.
  if (!verifySessionCookie(readSessionCookie(request))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) 입력 검증(zod)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }
  const url = parsed.data.url;

  // 3) 전체 URL 이면 fetch 없이 문자열에서 바로 추출(네트워크 없음).
  const direct = parseLatLngFromMapUrl(url);
  if (direct) {
    return Response.json({ data: { lat: direct[0], lng: direct[1] } }, { status: 200 });
  }

  // 4) 좌표가 없으면 단축링크일 수 있다 — 구글 호스트만 리다이렉트를 펼친다.
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return Response.json({ error: "invalid url" }, { status: 400 });
  }
  if (!isGoogleHost(host)) {
    return Response.json({ error: "구글 지도 링크만 지원해요" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(5000) });
    const coords = parseLatLngFromMapUrl(res.url ?? "") ?? parseLatLngFromMapUrl(await res.text());
    if (!coords) {
      return Response.json({ error: "링크에서 좌표를 찾지 못했어요" }, { status: 404 });
    }
    return Response.json({ data: { lat: coords[0], lng: coords[1] } }, { status: 200 });
  } catch {
    return Response.json({ error: "링크를 펼치지 못했어요" }, { status: 502 });
  }
}
