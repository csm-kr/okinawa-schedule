// 선택한 날의 동선 지도 — 좌표 있는 항목을 시간순 번호 마커 + 연결선으로 그리고,
// 자동차(🚗) 마커가 경로를 따라 움직인다. url 있는 번호 마커는 누르면 새 탭으로 연다.
// Leaflet 은 window 의존이라 클라이언트에서만(useEffect) 로드.
// KV·외부 서비스 미접근(R1/R2 무관). 좌표 없는 날이면 렌더하지 않는다.
'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Day } from '@/types/itinerary';
import { dayRoutePoints, pointAlongPath, type LatLng } from '@/lib/map';

// OSM 무료 타일(API 키 없음).
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const CORAL = '#E8714E'; // 살구 코랄(경로선)
const LOOP_MS = 7000; // 한 바퀴 이동 시간

type LeafletNS = typeof import('leaflet');

// clickable 이면 커서 포인터 + 링(누를 수 있다는 힌트).
function numberIcon(L: LeafletNS, n: number, clickable: boolean) {
  const ring = clickable ? ',0 0 0 4px rgba(232,113,78,.35)' : '';
  const cursor = clickable ? 'cursor:pointer;' : '';
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="${cursor}width:30px;height:30px;border-radius:9999px;background:linear-gradient(135deg,#F6C06A,#E8714E 45%,#C75B43);color:#2A1A12;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px rgba(42,26,18,.55),0 4px 12px rgba(224,122,95,.55)${ring}">${n}</div>`,
  });
}

function emojiIcon(L: LeafletNS, emoji: string) {
  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))">${emoji}</div>`,
  });
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// 동선은 렌트카 기준 — 자동차 아이콘이 경로를 따라 이동한다.
function moverEmoji(_day: Day): string {
  return '🚗';
}

export function DayMap({ day }: { day: Day }) {
  const points = dayRoutePoints(day);
  const route: LatLng[] = points.map((p) => p.pos);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (route.length === 0 || !elRef.current) return;
    let cancelled = false;
    let raf = 0;
    let map: import('leaflet').Map | undefined;

    void (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !elRef.current) return;

      map = L.map(elRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });
      L.tileLayer(TILE_URL, { maxZoom: 19, subdomains: 'abc' }).addTo(map);

      points.forEach((p, i) => {
        const marker = L.marker(p.pos, { icon: numberIcon(L, i + 1, !!p.url) }).addTo(map!);
        if (p.url) {
          // 번호 마커를 누르면 해당 항목 링크를 새 탭으로 연다.
          const url = p.url;
          marker.on('click', () => window.open(url, '_blank', 'noopener,noreferrer'));
          marker.bindTooltip(p.title, { direction: 'top', offset: [0, -14] });
        }
      });

      if (route.length >= 2) {
        // 글로우용 바깥선(앰버) + 본선(살구 코랄).
        L.polyline(route, { color: '#F4A82F', weight: 8, opacity: 0.25 }).addTo(map);
        L.polyline(route, { color: CORAL, weight: 4, opacity: 0.95 }).addTo(map);
      }
      map.fitBounds(route, { padding: [36, 36], maxZoom: 14 });

      if (route.length >= 2) {
        const mover = L.marker(route[0], { icon: emojiIcon(L, moverEmoji(day)) }).addTo(map);
        if (!prefersReducedMotion()) {
          let start = 0;
          const tick = (ts: number) => {
            if (cancelled) return;
            if (!start) start = ts;
            const t = ((ts - start) % LOOP_MS) / LOOP_MS;
            mover.setLatLng(pointAlongPath(route, t));
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (map) map.remove();
    };
    // route 는 day 에서 파생 — day 가 바뀌면 지도를 새로 그린다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  if (route.length === 0) return null;

  return (
    <section className="glass animate-fade-up overflow-hidden rounded-3xl p-2 shadow-glass">
      <div className="flex items-center gap-2 px-3 pb-2 pt-1">
        <span className="text-meta font-semibold uppercase tracking-[0.2em] text-gold">
          🗺️ 오늘의 동선
        </span>
        <span className="gold-rule mt-0.5 flex-1" aria-hidden />
      </div>
      <div className="map-dark overflow-hidden rounded-2xl ring-1 ring-white/10">
        <div
          ref={elRef}
          data-testid="day-map"
          role="application"
          aria-label="선택한 날의 동선 지도"
          className="h-64 w-full"
        />
      </div>
    </section>
  );
}
