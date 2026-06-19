import { describe, it, expect } from 'vitest';
import { dayRoute, dayRoutePoints, pointAlongPath, type LatLng } from './map';
import type { Day } from '@/types/itinerary';

const day: Day = {
  id: 'd1',
  date: '2026-06-21',
  label: '1일차',
  items: [
    // 일부러 시간 역순으로 둬서 정렬을 검증한다.
    { id: 'b', startTime: '13:00', title: '점심', lat: 26.21, lng: 127.69 },
    { id: 'a', startTime: '09:00', title: '공항', lat: 26.20, lng: 127.65 },
    { id: 'noCoord', startTime: '10:00', title: '이동' }, // 좌표 없음 → 제외
    { id: 'c', startTime: '16:00', title: '숙소', lat: 26.70, lng: 128.02 },
  ],
};

describe('dayRoute', () => {
  it('좌표 있는 항목만 startTime 오름차순 [lat,lng] 로 모은다', () => {
    expect(dayRoute(day)).toEqual([
      [26.2, 127.65],
      [26.21, 127.69],
      [26.7, 128.02],
    ]);
  });

  it('좌표 있는 항목이 없으면 빈 배열', () => {
    const empty: Day = { id: 'x', date: '2026-06-21', label: '1', items: [{ id: 'i', startTime: '09:00', title: '메모' }] };
    expect(dayRoute(empty)).toEqual([]);
  });

  it('lat 만 있고 lng 없으면 제외한다(둘 다 있어야 점)', () => {
    const partial: Day = {
      id: 'x', date: '2026-06-21', label: '1',
      items: [{ id: 'i', startTime: '09:00', title: '반쪽', lat: 26.2 }],
    };
    expect(dayRoute(partial)).toEqual([]);
  });
});

describe('dayRoutePoints', () => {
  it('좌표 있는 항목을 시간순으로 pos·title·url 과 함께 반환한다', () => {
    const d: Day = {
      id: 'd1',
      date: '2026-06-21',
      label: '1일차',
      items: [
        { id: 'b', startTime: '13:00', title: '점심', lat: 26.21, lng: 127.69, url: 'https://maps/x' },
        { id: 'a', startTime: '09:00', title: '공항', lat: 26.2, lng: 127.65 },
        { id: 'n', startTime: '10:00', title: '이동' }, // 좌표 없음 → 제외
      ],
    };
    expect(dayRoutePoints(d)).toEqual([
      { pos: [26.2, 127.65], title: '공항', url: undefined },
      { pos: [26.21, 127.69], title: '점심', url: 'https://maps/x' },
    ]);
  });
});

describe('pointAlongPath', () => {
  const path: LatLng[] = [
    [0, 0],
    [0, 10],
    [0, 20],
  ];

  it('t=0 이면 첫 점, t=1 이면 마지막 점', () => {
    expect(pointAlongPath(path, 0)).toEqual([0, 0]);
    expect(pointAlongPath(path, 1)).toEqual([0, 20]);
  });

  it('t=0.5 면 전체 길이의 절반 지점', () => {
    expect(pointAlongPath(path, 0.5)).toEqual([0, 10]);
  });

  it('t=0.25 면 첫 구간 중간', () => {
    expect(pointAlongPath(path, 0.25)).toEqual([0, 5]);
  });

  it('t 를 [0,1] 로 클램프한다', () => {
    expect(pointAlongPath(path, -0.5)).toEqual([0, 0]);
    expect(pointAlongPath(path, 2)).toEqual([0, 20]);
  });

  it('점이 하나면 어떤 t 라도 그 점', () => {
    expect(pointAlongPath([[5, 5]], 0.7)).toEqual([5, 5]);
  });
});
