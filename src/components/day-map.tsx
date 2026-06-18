// 선택한 날의 동선 지도 — 좌표 있는 항목을 시간순 번호 마커 + 연결선으로 그리고,
// 이동 마커(✈️/🚌)가 경로를 따라 움직인다. Leaflet 은 window 의존이라 클라이언트에서만(useEffect) 로드.
// KV·외부 서비스 미접근(R1/R2 무관). 좌표 없는 날이면 렌더하지 않는다.
'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Day } from '@/types/itinerary';
import { dayRoute, pointAlongPath, type LatLng } from '@/lib/map';

// OSM 무료 타일(API 키 없음).
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const CORAL = '#E07A5F';
const LOOP_MS = 7000; // 한 바퀴 이동 시간

type LeafletNS = typeof import('leaflet');

function numberIcon(L: LeafletNS, n: number) {
  return L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;border-radius:9999px;background:${CORAL};color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.35)">${n}</div>`,
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

// 비행(✈️) 항목이 있는 날이면 비행기, 아니면 버스 아이콘으로 이동시킨다.
function moverEmoji(day: Day): string {
  return day.items.some((it) => it.title.includes('✈')) ? '✈️' : '🚌';
}

export function DayMap({ day }: { day: Day }) {
  const route: LatLng[] = dayRoute(day);
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

      route.forEach((pt, i) => {
        L.marker(pt, { icon: numberIcon(L, i + 1) }).addTo(map!);
      });

      if (route.length >= 2) {
        L.polyline(route, { color: CORAL, weight: 4, opacity: 0.85 }).addTo(map);
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
    <div className="overflow-hidden rounded-2xl border border-line">
      <div
        ref={elRef}
        data-testid="day-map"
        role="application"
        aria-label="선택한 날의 동선 지도"
        className="h-64 w-full"
      />
    </div>
  );
}
