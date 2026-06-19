import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TimelineList } from './timeline-list';
import type { Day } from '@/types/itinerary';

// now 는 항상 명시적 UTC 로 준다(R7). KST 벽시계 = UTC + 9h.
const day: Day = {
  id: 'd1',
  date: '2026-09-19',
  label: '1일차',
  items: [
    { id: 'i3', startTime: '18:00', endTime: '20:00', title: '가족 만찬' },
    { id: 'i1', startTime: '09:00', endTime: '10:00', title: '도착·체크인' },
    { id: 'i2', startTime: '12:00', title: '점심' },
  ],
};

describe('TimelineList', () => {
  it('day 의 모든 항목을 렌더한다', () => {
    render(<TimelineList day={day} now={new Date('2026-09-19T00:30:00Z')} />);
    expect(screen.getByText('도착·체크인')).toBeInTheDocument();
    expect(screen.getByText('점심')).toBeInTheDocument();
    expect(screen.getByText('가족 만찬')).toBeInTheDocument();
  });

  it('startTime 오름차순으로 렌더한다', () => {
    render(<TimelineList day={day} now={new Date('2026-09-19T00:30:00Z')} />);
    const titles = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
    const idxArrival = titles.findIndex((t) => t.includes('도착·체크인'));
    const idxLunch = titles.findIndex((t) => t.includes('점심'));
    const idxDinner = titles.findIndex((t) => t.includes('가족 만찬'));
    expect(idxArrival).toBeLessThan(idxLunch);
    expect(idxLunch).toBeLessThan(idxDinner);
  });

  it('좌표 있는 항목에만 지도와 같은 번호 뱃지를 단다', () => {
    const mapped: Day = {
      id: 'd2',
      date: '2026-09-19',
      label: '1일차',
      items: [
        { id: 'm1', startTime: '09:00', title: '공항', lat: 26.2, lng: 127.65 },
        { id: 'm2', startTime: '12:00', title: '점심' }, // 좌표 없음 → 번호 없음
        { id: 'm3', startTime: '16:00', title: '숙소', lat: 26.7, lng: 128.0 },
      ],
    };
    render(<TimelineList day={mapped} now={new Date('2026-09-19T00:00:00Z')} />);
    // 좌표 있는 항목만, 시간순 1·2 (점심은 뱃지 없음)
    const badges = screen.getAllByTestId('map-number').map((b) => b.textContent);
    expect(badges).toEqual(['1', '2']);
  });

  it('현재 시간대(±60분) 항목에 시간대 블록 음영을 표시한다', () => {
    const d: Day = {
      id: 'd1',
      date: '2026-09-19',
      label: '1일차',
      items: [
        { id: 'i1', startTime: '09:00', endTime: '10:00', title: '도착·체크인' },
        { id: 'i2', startTime: '12:00', title: '점심' },
        { id: 'i3', startTime: '18:00', title: '가족 만찬' },
      ],
    };
    // 11:30 KST(02:30 UTC): i2(12:00)만 30분 뒤 시작 → 블록 음영. 나머지는 멀어 제외.
    render(<TimelineList day={d} now={new Date('2026-09-19T02:30:00Z')} />);
    const blocked = screen
      .getAllByRole('listitem')
      .filter((li) => li.hasAttribute('data-now-block'));
    expect(blocked).toHaveLength(1);
    expect(blocked[0]).toHaveTextContent('점심');
  });

  it('현재 시각 기준 진행 중인 항목을 current 로 강조한다', () => {
    // 18:30 KST = 09:30 UTC → 가족 만찬(18:00~20:00) 진행 중
    render(<TimelineList day={day} now={new Date('2026-09-19T09:30:00Z')} />);
    const list = screen.getByTestId('timeline-list');
    const current = within(list).getByText('지금').closest('[data-status]');
    expect(current).toHaveAttribute('data-status', 'current');
    expect(current).toHaveTextContent('가족 만찬');
  });
});
