import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TimelineView } from './timeline-view';
import type { Itinerary } from '@/types/itinerary';

const itinerary: Itinerary = {
  title: '칠순잔치',
  timezone: 'Asia/Seoul',
  version: 1,
  updatedAt: '2026-09-01T00:00:00.000Z',
  days: [
    {
      id: 'd1',
      date: '2026-09-19',
      label: '1일차',
      items: [{ id: 'i1', startTime: '18:00', title: '가족 만찬' }],
    },
    {
      id: 'd2',
      date: '2026-09-20',
      label: '2일차',
      items: [{ id: 'j1', startTime: '09:00', title: '조식' }],
    },
  ],
};

describe('TimelineView', () => {
  it('일정이 null 이면 빈 상태 문구를 보여준다', () => {
    render(<TimelineView itinerary={null} />);
    expect(screen.getByText('아직 등록된 일정이 없어요')).toBeInTheDocument();
  });

  it('모든 day 에 항목이 없으면 빈 상태 문구를 보여준다', () => {
    const empty: Itinerary = { ...itinerary, days: [{ id: 'd1', date: '2026-09-19', label: '1일차', items: [] }] };
    render(<TimelineView itinerary={empty} />);
    expect(screen.getByText('아직 등록된 일정이 없어요')).toBeInTheDocument();
  });

  it('초기 선택된 day 의 항목과 날짜 탭을 렌더한다', () => {
    render(<TimelineView itinerary={itinerary} initialDayId="d1" />);
    expect(screen.getByRole('tab', { name: /1일차/ })).toBeInTheDocument();
    expect(within(screen.getByTestId('timeline-list')).getByText('가족 만찬')).toBeInTheDocument();
  });

  it('다른 날짜 탭을 누르면 그 날의 항목으로 바뀐다', () => {
    render(<TimelineView itinerary={itinerary} initialDayId="d1" />);
    fireEvent.click(screen.getByRole('tab', { name: /2일차/ }));
    const list = screen.getByTestId('timeline-list');
    expect(within(list).getByText('조식')).toBeInTheDocument();
    expect(within(list).queryByText('가족 만찬')).not.toBeInTheDocument();
  });
});
