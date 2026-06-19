import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayMap } from './day-map';
import type { Day } from '@/types/itinerary';

// Leaflet 은 실제 DOM 레이아웃·타일이 필요해 jsdom 에서 무겁다 — 최소 스텁으로 모킹한다.
// 렌더(컨테이너 유무) 분기만 검증하고, 실제 지도/애니메이션은 E2E(Playwright)로 본다.
vi.mock('leaflet', () => {
  const layer = {
    addTo: () => layer,
    setLatLng: () => layer,
    on: () => layer,
    bindTooltip: () => layer,
    remove: () => {},
  };
  const L = {
    map: () => ({ fitBounds: () => {}, remove: () => {}, setView: () => {} }),
    tileLayer: () => layer,
    polyline: () => layer,
    marker: () => layer,
    divIcon: () => ({}),
  };
  return { default: L };
});

const withCoords: Day = {
  id: 'd1',
  date: '2026-06-21',
  label: '1일차',
  items: [
    { id: 'a', startTime: '09:00', title: '공항', lat: 26.2, lng: 127.65 },
    { id: 'b', startTime: '16:00', title: '숙소', lat: 26.7, lng: 128.02 },
  ],
};

const noCoords: Day = {
  id: 'd2',
  date: '2026-06-22',
  label: '2일차',
  items: [{ id: 'x', startTime: '08:00', title: '아침' }],
};

describe('DayMap', () => {
  it('좌표 있는 날이면 지도 컨테이너를 렌더한다', () => {
    render(<DayMap day={withCoords} />);
    expect(screen.getByTestId('day-map')).toBeInTheDocument();
  });

  it('좌표 없는 날이면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<DayMap day={noCoords} />);
    expect(screen.queryByTestId('day-map')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
