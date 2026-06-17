import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusCard } from './status-card';
import type { Itinerary } from '@/types/itinerary';

// now 는 명시적 UTC(R7). KST = UTC + 9h.
const itinerary: Itinerary = {
  title: '환갑잔치',
  timezone: 'Asia/Seoul',
  version: 1,
  updatedAt: '2026-09-01T00:00:00.000Z',
  days: [
    {
      id: 'd1',
      date: '2026-09-19',
      label: '1일차',
      items: [
        { id: 'i1', startTime: '09:00', endTime: '10:00', title: '도착·체크인' },
        { id: 'i2', startTime: '12:00', title: '점심' },
        { id: 'i3', startTime: '18:00', title: '가족 만찬' }, // 마지막 → +60분(19:00)
      ],
    },
    {
      id: 'd2',
      date: '2026-09-20',
      label: '2일차',
      items: [
        { id: 'j1', startTime: '09:00', title: '조식' },
        { id: 'j2', startTime: '11:00', title: '체크아웃' },
      ],
    },
  ],
};

describe('StatusCard', () => {
  it('진행 중인 항목이 있으면 "지금 진행 중" 뱃지와 제목을 보여준다', () => {
    // 18:30 KST = 09:30 UTC → 가족 만찬(18:00~19:00) 진행 중
    render(<StatusCard itinerary={itinerary} now={new Date('2026-09-19T09:30:00Z')} />);
    expect(screen.getByText('지금 진행 중')).toBeInTheDocument();
    expect(screen.getByTestId('status-card')).toHaveTextContent('가족 만찬');
  });

  it('진행 중 + 다음 항목이 있으면 "다음 ▸" 미리보기를 보여준다', () => {
    render(<StatusCard itinerary={itinerary} now={new Date('2026-09-19T09:30:00Z')} />);
    const card = screen.getByTestId('status-card');
    expect(card).toHaveTextContent('다음');
    expect(card).toHaveTextContent('조식'); // 다음 항목(이튿날 첫 일정)
  });

  it('항목 사이(진행 중 없음)면 다음 항목을 안내한다', () => {
    // 11:00 KST = 02:00 UTC → i1 끝(10:00)~i2 시작(12:00) 사이, 다음 = 점심
    render(<StatusCard itinerary={itinerary} now={new Date('2026-09-19T02:00:00Z')} />);
    const card = screen.getByTestId('status-card');
    expect(screen.queryByText('지금 진행 중')).not.toBeInTheDocument();
    expect(card).toHaveTextContent('다음');
    expect(card).toHaveTextContent('점심');
  });

  it('행사 시작 전이면 안내 문구를 보여준다', () => {
    // 08:00 KST 09-19 = 23:00 UTC 09-18
    render(<StatusCard itinerary={itinerary} now={new Date('2026-09-18T23:00:00Z')} />);
    expect(screen.getByText('행사 시작 전이에요')).toBeInTheDocument();
  });

  it('행사가 끝났으면 마무리 문구를 보여준다', () => {
    // 13:00 KST 09-20 = 04:00 UTC → 마지막 종료(12:00 KST) 이후
    render(<StatusCard itinerary={itinerary} now={new Date('2026-09-20T04:00:00Z')} />);
    expect(screen.getByText('모든 일정이 끝났어요. 함께해 주셔서 고맙습니다')).toBeInTheDocument();
  });
});
