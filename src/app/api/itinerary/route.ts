// 공개 일정 read(GET) · 보호된 전체 저장(PUT). KV 접근은 services/storage 인터페이스로만(R1·R2).

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStore } from "@/services/storage";
import { VersionConflictError } from "@/services/storage/types";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";

// types/itinerary.ts 와 일치하는 입력 검증 스키마.
const ScheduleItemSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  title: z.string(),
  location: z.string().optional(),
  note: z.string().optional(),
  url: z.string().url().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
const DaySchema = z.object({
  id: z.string(),
  date: z.string(),
  label: z.string(),
  items: z.array(ScheduleItemSchema),
});
const ItinerarySchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  timezone: z.literal("Asia/Seoul"),
  version: z.number(),
  updatedAt: z.string(),
  days: z.array(DaySchema),
});
const PutSchema = z.object({
  itinerary: ItinerarySchema,
  expectedVersion: z.number(),
});

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

export async function GET(): Promise<Response> {
  try {
    const data = await getStore().get();
    return Response.json({ data }, { status: 200 });
  } catch {
    return Response.json({ error: "일정을 불러오지 못했어요" }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<Response> {
  // 1) 인증(R3) — 쓰기는 세션 쿠키를 서버에서 반드시 검증.
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
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  // 3) 저장(R5) — 전체 PUT + 낙관적 동시성. 충돌은 409.
  try {
    const saved = await getStore().put(
      parsed.data.itinerary,
      parsed.data.expectedVersion,
    );
    revalidatePath("/");
    return Response.json({ data: saved }, { status: 200 });
  } catch (err) {
    if (err instanceof VersionConflictError) {
      return Response.json(
        { error: "다른 곳에서 일정이 바뀌었어요. 새로고침 후 다시 저장해 주세요" },
        { status: 409 },
      );
    }
    return Response.json({ error: "server error" }, { status: 500 });
  }
}
