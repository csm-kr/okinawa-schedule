// 동선 지도용 순수 로직 — 데이터/외부 접근 없음(단위 테스트 대상).
// 좌표는 [위도, 경도] 튜플(Leaflet LatLngTuple 과 동일 형식).
import type { Day } from '@/types/itinerary';

export type LatLng = [number, number];

// 좌표(lat·lng 둘 다)가 있는 항목만 startTime 오름차순으로 모아 좌표열을 만든다.
// 좌표 없는 항목(텍스트만 장소)은 동선에서 제외된다.
export function dayRoute(day: Day): LatLng[] {
  return [...day.items]
    .filter((it) => typeof it.lat === 'number' && typeof it.lng === 'number')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((it) => [it.lat as number, it.lng as number]);
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
