// 동선 지도용 순수 로직 — 데이터/외부 접근 없음(단위 테스트 대상).
// 좌표는 [위도, 경도] 튜플(Leaflet LatLngTuple 과 동일 형식).
import type { Day, ScheduleItem } from '@/types/itinerary';

export type LatLng = [number, number];

// 지도 마커 1개 — 위치 + 라벨 + (선택)링크. 링크가 있으면 마커를 누르면 새 탭으로 연다.
export type RoutePoint = { pos: LatLng; title: string; url?: string };

// 좌표(lat·lng 둘 다)가 있는 항목만 startTime 오름차순으로 — 동선 마커·번호의 단일 정렬 기준.
// 좌표 없는 항목(텍스트만 장소)은 동선에서 제외된다.
function coordItems(day: Day): ScheduleItem[] {
  return [...day.items]
    .filter((it) => typeof it.lat === 'number' && typeof it.lng === 'number')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// 좌표열만 만든다(이동 마커 애니메이션용).
export function dayRoute(day: Day): LatLng[] {
  return dayRoutePoints(day).map((p) => p.pos);
}

// dayRoute 와 같은 항목을 pos·title·url 묶음으로 반환 — 마커 클릭 링크용.
export function dayRoutePoints(day: Day): RoutePoint[] {
  return coordItems(day).map((it) => ({
    pos: [it.lat as number, it.lng as number],
    title: it.title,
    url: it.url,
  }));
}

// 지도 마커로 찍히는 항목의 id → 마커 번호(1-based) 매핑.
// dayRoutePoints 와 같은 정렬을 써서 타임라인 번호 뱃지가 지도 번호와 정확히 일치한다.
// 좌표 없는 항목은 맵에 없다(지도에도 안 뜨므로 번호도 없음).
export function routeNumberById(day: Day): Map<string, number> {
  const m = new Map<string, number>();
  coordItems(day).forEach((it, i) => m.set(it.id, i + 1));
  return m;
}

// 구글맵 링크에서 [위도, 경도] 를 뽑는다 — admin 좌표 입력 보조(클라이언트·서버 공용).
// 지원: place(!3d!4d, 가장 정확) · query/q/ll= · @lat,lng(지도 중심) · 평문 "lat,lng".
// 단축링크(maps.app.goo.gl)는 좌표가 안 담겨 있어 null → 서버에서 리다이렉트를 펼쳐야 한다.
export function parseLatLngFromMapUrl(input: string): LatLng | null {
  if (!input) return null;
  let s = input.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // 잘못된 퍼센트 인코딩이면 원문 그대로 시도한다.
  }

  const n = '(-?\\d+(?:\\.\\d+)?)';
  // 정확도 순서: place 좌표 → 쿼리 파라미터 → 지도 중심 → 평문.
  const patterns = [
    new RegExp(`!3d${n}!4d${n}`),
    new RegExp(`[?&](?:query|q|ll|destination)=${n}\\s*,\\s*${n}`),
    new RegExp(`@${n}\\s*,\\s*${n}`),
    new RegExp(`^${n}\\s*,\\s*${n}$`),
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return [lat, lng];
    }
  }
  return null;
}

// 경로 전체 길이 기준 t∈[0,1] 위치의 보간 좌표. 이동 마커 애니메이션용.
// 거리는 lat/lng 평면 유클리드(소규모 동선·애니메이션 용도로 충분, 측지선 아님).
export function pointAlongPath(path: LatLng[], t: number): LatLng {
  if (path.length === 0) throw new Error('pointAlongPath: 빈 경로');
  if (path.length === 1) return path[0];

  const clamped = Math.min(1, Math.max(0, t));
  const segLen: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    segLen.push(d);
    total += d;
  }
  if (total === 0) return path[0];

  let target = clamped * total;
  for (let i = 0; i < segLen.length; i++) {
    if (target <= segLen[i] || i === segLen.length - 1) {
      const frac = segLen[i] === 0 ? 0 : target / segLen[i];
      const a = path[i];
      const b = path[i + 1];
      return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
    }
    target -= segLen[i];
  }
  return path[path.length - 1];
}
