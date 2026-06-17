import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayTabs } from './day-tabs';
import type { Day } from '@/types/itinerary';

const days: Day[] = [
  { id: 'd1', date: '2026-09-19', label: '1일차', items: [] },
  { id: 'd2', date: '2026-09-20', label: '2일차', items: [] },
  { id: 'd3', date: '2026-09-21', label: '3일차', items: [] },
];

describe('DayTabs', () => {
  it('day 마다 탭을 렌더한다', () => {
    render(<DayTabs days={days} selectedId="d1" onSelect={() => {}} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: /1일차/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /3일차/ })).toBeInTheDocument();
  });

  it('선택된 탭은 aria-selected=true 다', () => {
    render(<DayTabs days={days} selectedId="d2" onSelect={() => {}} />);
    expect(screen.getByRole('tab', { name: /2일차/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /1일차/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('탭을 누르면 해당 day id 로 onSelect 를 호출한다', () => {
    const onSelect = vi.fn();
    render(<DayTabs days={days} selectedId="d1" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('tab', { name: /3일차/ }));
    expect(onSelect).toHaveBeenCalledWith('d3');
  });

  it('터치 타깃(탭 높이)을 48px 이상으로 보장한다', () => {
    render(<DayTabs days={days} selectedId="d1" onSelect={() => {}} />);
    // min-h-12 = 3rem = 48px (실제 픽셀 검증은 E2E, 여기서는 클래스 계약을 확인)
    expect(screen.getByRole('tab', { name: /1일차/ }).className).toMatch(/min-h-12/);
  });
});
