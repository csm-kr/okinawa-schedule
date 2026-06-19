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

  it('url 이 있으면 새 탭으로 여는 링크를 보여준다', () => {
    const withUrl: ScheduleItem = { ...item, url: 'https://maps.google.com/?q=한정식' };
    render(<TimelineItem item={withUrl} status="upcoming" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://maps.google.com/?q=한정식');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('url 이 없으면 링크를 렌더하지 않는다', () => {
    render(<TimelineItem item={item} status="upcoming" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('number 가 있으면 지도와 같은 번호 뱃지를 보여준다', () => {
    render(<TimelineItem item={item} status="upcoming" number={2} />);
    expect(screen.getByTestId('map-number')).toHaveTextContent('2');
  });

  it('number 가 없으면(좌표 없는 항목) 번호 뱃지를 렌더하지 않는다', () => {
    render(<TimelineItem item={item} status="upcoming" />);
    expect(screen.queryByTestId('map-number')).not.toBeInTheDocument();
  });

  it('nowBlock 위치가 주어지면 data-now-block 으로 현재 시간대 블록을 표시한다', () => {
    const { container } = render(<TimelineItem item={item} status="upcoming" nowBlock="top" />);
    expect(container.firstChild).toHaveAttribute('data-now-block', 'top');
  });

  it('nowBlock 이 없으면 data-now-block 속성이 없다', () => {
    const { container } = render(<TimelineItem item={item} status="upcoming" />);
    expect(container.firstChild).not.toHaveAttribute('data-now-block');
  });

  it('endTime·location·note 가 없으면 해당 영역을 렌더하지 않는다', () => {
    const minimal: ScheduleItem = { id: 'i2', startTime: '09:00', title: '조식' };
    render(<TimelineItem item={minimal} status="upcoming" />);
    expect(screen.getByText('조식')).toBeInTheDocument();
    expect(screen.queryByText('한정식 본관')).not.toBeInTheDocument();
  });
});
