// KST(Asia/Seoul) tz-aware 시각 헬퍼. 기기 로컬 tz 에 의존하지 않는다(R7).

const KST = "Asia/Seoul";

// 절대 시각(instant)을 timeZone 벽시계로 본 뒤, 그 벽시계를 UTC 로 간주한 값과의 차이로
// 해당 시점의 tz 오프셋(ms)을 구한다. (date-fns-tz 가 쓰는 표준 기법)
function offsetMs(timeZone: string, instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(instant)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUTC - instant.getTime();
}

// "YYYY-MM-DD" + "HH:mm" 을 Asia/Seoul 벽시계로 해석한 절대 시각으로 합성한다.
export function combineKst(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  // 벽시계 값을 일단 UTC 로 간주한 ms.
  const wallAsUTC = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  // KST 는 DST 가 없어 오프셋이 상수(+9h) — 1패스 보정으로 정확하다.
  return new Date(wallAsUTC - offsetMs(KST, new Date(wallAsUTC)));
}
