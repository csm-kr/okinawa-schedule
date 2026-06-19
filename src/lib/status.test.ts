import { describe, it, expect } from 'vitest';
import { getItemStatus, findCurrentAndNext, getEventPhase } from './status';
import type { Day, Itinerary, ScheduleItem } from '@/types/itinerary';

// 입력 now 는 항상 명시적 UTC("...Z")로 준다 — 테스트가 기기 로컬 tz 에 의존하지 않게(R7).
// 환산: KST 벽시계 = UTC + 9h. (예: 13:00 KST = 04:00 UTC)
const day1Items: ScheduleItem[] = [
  { id: 'i1', startTime: '09:00', endTime: '10:00', title: '도착·체크인' }, // 종료 명시
  { id: 'i2', startTime: '12:00', title: '점심' }, // 종료 없음 → 다음 i3(18:00)이 경계
  { id: 'i3', startTime: '18:00', title: '가족 만찬' }, // 마지막 → 시작+60분(19:00)
];
const day1: Day = { id: 'd1', date: '2026-09-19', label: '1일차', items: day1Items };

const day2Items: ScheduleItem[] = [
  { id: 'j1', startTime: '09:00', title: '조식' },
  { id: 'j2', startTime: '11:00', title: '체크아웃' }, // 마지막 → +60분(12:00)
];
const day2: Day = { id: 'd2', date: '2026-09-20', label: '2일차', items: day2Items };

const itinerary: Itinerary = {
  title: '칠순잔치',
  timezone: 'Asia/Seoul',
  version: 1,
  updatedAt: '2026-09-01T00:00:00.000Z',
  days: [day1, day2],
};

describe('getItemStatus', () => {
  it('시작 전이면 upcoming', () => {
    // 08:00 KST = 전날 23:00 UTC
    expect(getItemStatus(day1Items[0], day1, day1Items, new Date('2026-09-18T23:00:00Z'))).toBe('upcoming');
  });

  it('endTime 명시: 시작~종료 사이면 current', () => {
    // 09:30 KST = 00:30 UTC (i1 09:00~10:00)
    expect(getItemStatus(day1Items[0], day1, day1Items, new Date('2026-09-19T00:30:00Z'))).toBe('current');
  });

  it('endTime 명시: 종료 후면 past', () => {
    // 11:00 KST = 02:00 UTC
    expect(getItemStatus(day1Items[0], day1, day1Items, new Date('2026-09-19T02:00:00Z'))).toBe('past');
  });

  it('endTime 없으면 같은 day 의 다음 item.startTime 이 종료 경계', () => {
    // i2 12:00, 다음 i3 18:00 → 13:00 KST(04:00 UTC) current, 18:30 KST(09:30 UTC) past
    expect(getItemStatus(day1Items[1], day1, day1Items, new Date('2026-09-19T04:00:00Z'))).toBe('current');
    expect(getItemStatus(day1Items[1], day1, day1Items, new Date('2026-09-19T09:30:00Z'))).toBe('past');
  });

  it('마지막 item 은 endTime 없으면 시작+60분이 종료', () => {
    // i3 18:00~19:00 → 18:30 KST(09:30 UTC) current, 19:30 KST(10:30 UTC) past
    expect(getItemStatus(day1Items[2], day1, day1Items, new Date('2026-09-19T09:30:00Z'))).toBe('current');
    expect(getItemStatus(day1Items[2], day1, day1Items, new Date('2026-09-19T10:30:00Z'))).toBe('past');
  });

  it('비-KST 기기 시각(명시적 UTC)을 줘도 KST 기준으로 판정한다 (R7)', () => {
    // 09:30 UTC = 18:30 KST → i3(18:00~19:00) current. 로컬 파싱 의존 시 틀어진다.
    expect(getItemStatus(day1Items[2], day1, day1Items, new Date('2026-09-19T09:30:00Z'))).toBe('current');
  });
});

describe('findCurrentAndNext', () => {
  it('현재 진행 항목과 바로 다음 항목을 찾는다', () => {
    const now = new Date('2026-09-19T04:00:00Z'); // 13:00 KST → i2 진행 중
    const { current, next } = findCurrentAndNext(itinerary, now);
    expect(current?.item.id).toBe('i2');
    expect(next?.item.id).toBe('i3');
  });

  it('항목 사이(gap)면 current 없이 다음 항목만 반환한다', () => {
    const now = new Date('2026-09-19T01:30:00Z'); // 10:30 KST: i1 종료(10:00)~i2 시작(12:00) 사이
    const { current, next } = findCurrentAndNext(itinerary, now);
    expect(current).toBeUndefined();
    expect(next?.item.id).toBe('i2');
  });

  it('day 경계를 넘어 current/next 를 찾는다', () => {
    const now = new Date('2026-09-19T09:30:00Z'); // 18:30 KST: day1 마지막 i3 진행 중
    const { current, next } = findCurrentAndNext(itinerary, now);
    expect(current?.item.id).toBe('i3');
    expect(current?.day.id).toBe('d1');
    expect(next?.item.id).toBe('j1'); // 다음은 day2 첫 항목
    expect(next?.day.id).toBe('d2');
  });
});

describe('getEventPhase', () => {
  it('첫 시작 전이면 before', () => {
    // 08:00 KST(전날 23:00 UTC) — day1 첫 항목 09:00 전
    expect(getEventPhase(itinerary, new Date('2026-09-18T23:00:00Z'))).toBe('before');
  });

  it('일정 사이면 during', () => {
    expect(getEventPhase(itinerary, new Date('2026-09-19T04:00:00Z'))).toBe('during'); // 13:00 KST
  });

  it('마지막 종료 후면 after', () => {
    // day2 마지막 j2 11:00~12:00 KST → 13:00 KST day2(04:00 UTC 2026-09-20) 이후 after
    expect(getEventPhase(itinerary, new Date('2026-09-20T04:00:00Z'))).toBe('after');
  });
});
