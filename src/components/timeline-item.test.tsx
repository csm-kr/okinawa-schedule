import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineItem } from './timeline-item';
import type { ScheduleItem } from '@/types/itinerary';

const item: ScheduleItem = {
  id: 'i1',
  startTime: '18:00',
  endTime: '20:00',
  title: '가족 만찬',
  location: '한정식 본관',
  note: '단체 사진 촬영',
};

describe('TimelineItem', () => {
  it('시각·제목·장소·메모를 보여준다', () => {
    render(<TimelineItem item={item} status="upcoming" />);
    expect(screen.getByText('가족 만찬')).toBeInTheDocument();
    expect(screen.getByText(/18:00/)).toBeInTheDocument();
    expect(screen.getByText('한정식 본관')).toBeInTheDocument();
    expect(screen.getByText('단체 사진 촬영')).toBeInTheDocument();
  });

  it('current 면 "지금" 뱃지를 보여주고 status 를 노출한다', () => {
    const { container } = render(<TimelineItem item={item} status="current" />);
    expect(screen.getByText('지금')).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('data-status', 'current');
  });

  it('past 면 "지금" 뱃지가 없다', () => {
    const { container } = render(<TimelineItem item={item} status="past" />);
    expect(screen.queryByText('지금')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('data-status', 'past');
  });

  it('upcoming 이면 "지금" 뱃지가 없다', () => {
    const { container } = render(<TimelineItem item={item} status="upcoming" />);
    expect(screen.queryByText('지금')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('data-status', 'upcoming');
  });

  it('endTime·location·note 가 없으면 해당 영역을 렌더하지 않는다', () => {
    const minimal: ScheduleItem = { id: 'i2', startTime: '09:00', title: '조식' };
    render(<TimelineItem item={minimal} status="upcoming" />);
    expect(screen.getByText('조식')).toBeInTheDocument();
    expect(screen.queryByText('한정식 본관')).not.toBeInTheDocument();
  });
});
