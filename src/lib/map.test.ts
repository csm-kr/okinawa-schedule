import { describe, it, expect } from 'vitest';
import { dayRoute, dayRoutePoints, pointAlongPath, parseLatLngFromMapUrl, type LatLng } from './map';
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

describe('parseLatLngFromMapUrl', () => {
  it('지도 중심 @lat,lng 형식', () => {
    expect(parseLatLngFromMapUrl('https://www.google.com/maps/@26.2124,127.6792,17z')).toEqual([
      26.2124, 127.6792,
    ]);
  });

  it('검색 링크 query=lat,lng 형식', () => {
    expect(
      parseLatLngFromMapUrl('https://www.google.com/maps/search/?api=1&query=26.214,127.689'),
    ).toEqual([26.214, 127.689]);
  });

  it('q=lat,lng 형식', () => {
    expect(parseLatLngFromMapUrl('https://maps.google.com/?q=26.214,127.689')).toEqual([
      26.214, 127.689,
    ]);
  });

  it('place 링크는 @중심이 아니라 !3d!4d 정확좌표를 우선한다', () => {
    expect(
      parseLatLngFromMapUrl(
        'https://www.google.com/maps/place/X/@26.21,127.67,17z/data=!3m1!4b1!3d26.2124!4d127.6792',
      ),
    ).toEqual([26.2124, 127.6792]);
  });

  it('퍼센트 인코딩된 콤마(%2C)도 처리한다', () => {
    expect(parseLatLngFromMapUrl('https://maps.google.com/?q=26.214%2C127.689')).toEqual([
      26.214, 127.689,
    ]);
  });

  it('평문 "lat, lng" 도 받는다', () => {
    expect(parseLatLngFromMapUrl('26.214, 127.689')).toEqual([26.214, 127.689]);
  });

  it('음수 좌표(남반구·서경)', () => {
    expect(parseLatLngFromMapUrl('https://www.google.com/maps/@-33.8688,151.2093,15z')).toEqual([
      -33.8688, 151.2093,
    ]);
  });

  it('좌표 없는 링크는 null (단축링크 maps.app.goo.gl 포함)', () => {
    expect(parseLatLngFromMapUrl('https://maps.app.goo.gl/abc123')).toBeNull();
    expect(parseLatLngFromMapUrl('https://example.com')).toBeNull();
    expect(parseLatLngFromMapUrl('')).toBeNull();
  });

  it('범위를 벗어난 좌표는 null (lat>90·lng>180)', () => {
    expect(parseLatLngFromMapUrl('https://www.google.com/maps/@200,500,17z')).toBeNull();
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
