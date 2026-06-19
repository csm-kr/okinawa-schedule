import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminForm } from './admin-form';
import type { Itinerary } from '@/types/itinerary';

const initial: Itinerary = {
  title: '칠순잔치',
  subtitle: '9.19–21',
  timezone: 'Asia/Seoul',
  version: 3,
  updatedAt: '2026-09-01T00:00:00.000Z',
  days: [
    {
      id: 'd1',
      date: '2026-09-19',
      label: '1일차',
      items: [{ id: 'i1', startTime: '18:00', title: '가족 만찬', location: '한정식 본관' }],
    },
    {
      id: 'd2',
      date: '2026-09-20',
      label: '2일차',
      items: [{ id: 'j1', startTime: '09:00', title: '조식' }],
    },
  ],
};

describe('AdminForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('선택된 날짜의 항목을 편집 가능한 필드로 렌더한다', () => {
    render(<AdminForm initial={initial} />);
    expect(screen.getByDisplayValue('가족 만찬')).toBeInTheDocument();
    expect(screen.getByDisplayValue('한정식 본관')).toBeInTheDocument();
    expect(screen.getByDisplayValue('18:00')).toBeInTheDocument();
  });

  it('날짜 탭을 바꾸면 그 날 항목이 보인다', () => {
    render(<AdminForm initial={initial} />);
    fireEvent.click(screen.getByRole('tab', { name: /2일차/ }));
    expect(screen.getByDisplayValue('조식')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('가족 만찬')).not.toBeInTheDocument();
  });

  it('제목을 수정할 수 있다', () => {
    render(<AdminForm initial={initial} />);
    fireEvent.change(screen.getByDisplayValue('가족 만찬'), { target: { value: '가족 만찬(수정)' } });
    expect(screen.getByDisplayValue('가족 만찬(수정)')).toBeInTheDocument();
  });

  it('"+ 일정 추가" 를 누르면 빈 항목이 추가된다', () => {
    render(<AdminForm initial={initial} />);
    expect(screen.getAllByLabelText('제목')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: '+ 일정 추가' }));
    expect(screen.getAllByLabelText('제목')).toHaveLength(2);
  });

  it('"삭제" 는 확인 후 항목을 제거한다', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AdminForm initial={initial} />);
    expect(screen.getAllByLabelText('제목')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(window.confirm).toHaveBeenCalledWith('이 일정을 삭제할까요?');
    expect(screen.queryByLabelText('제목')).not.toBeInTheDocument();
  });

  it('삭제 확인을 취소하면 항목을 남긴다(R6)', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminForm initial={initial} />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByDisplayValue('가족 만찬')).toBeInTheDocument();
  });

  it('저장 버튼은 56px(h-14) 다', () => {
    render(<AdminForm initial={initial} />);
    expect(screen.getByRole('button', { name: '저장' }).className).toMatch(/h-14/);
  });

  it('저장하면 expectedVersion 과 함께 PUT 하고 "저장됐어요" 를 보여준다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { ...initial, version: 4 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminForm initial={initial} />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장됐어요')).toBeInTheDocument();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/itinerary');
    expect(opts.method).toBe('PUT');
    const body = JSON.parse(opts.body);
    expect(body.expectedVersion).toBe(3); // R5 — 로드 시 version 을 그대로 전송
  });

  it('행사 제목(맨 위 title)을 수정하면 저장 payload 에 포함된다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { ...initial, version: 4 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminForm initial={initial} />);
    const titleInput = screen.getByLabelText('행사 제목') as HTMLInputElement;
    expect(titleInput.value).toBe('칠순잔치'); // 저장된 현재 title 을 보여준다
    fireEvent.change(titleInput, { target: { value: '조인수 · 김인숙 부부 칠순잔치' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await screen.findByText('저장됐어요');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.itinerary.title).toBe('조인수 · 김인숙 부부 칠순잔치');
  });

  it('위도·경도·링크를 입력하면 저장 payload 에 포함된다(숫자/문자)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { ...initial, version: 4 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminForm initial={initial} />);
    fireEvent.change(screen.getByLabelText('위도'), { target: { value: '26.2' } });
    fireEvent.change(screen.getByLabelText('경도'), { target: { value: '127.65' } });
    fireEvent.change(screen.getByLabelText('링크'), {
      target: { value: 'https://maps.google.com/?q=x' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await screen.findByText('저장됐어요');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const item = body.itinerary.days[0].items[0];
    expect(item.lat).toBe(26.2);
    expect(item.lng).toBe(127.65);
    expect(item.url).toBe('https://maps.google.com/?q=x');
  });

  it('링크를 비우면 payload 에서 빠진다(빈 문자열 url 로 인한 400 방지)', async () => {
    const withUrl: Itinerary = {
      ...initial,
      days: [
        { ...initial.days[0], items: [{ id: 'i1', startTime: '18:00', title: '가족 만찬', url: 'https://x.test' }] },
        initial.days[1],
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { ...withUrl, version: 5 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminForm initial={withUrl} />);
    fireEvent.change(screen.getByLabelText('링크'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await screen.findByText('저장됐어요');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.itinerary.days[0].items[0].url).toBeUndefined();
  });

  it('"좌표 채우기" 는 링크를 /api/resolve-map 으로 보내 위도·경도를 채운다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { lat: 26.5, lng: 127.9 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminForm initial={initial} />);
    fireEvent.change(screen.getByLabelText('링크'), {
      target: { value: 'https://maps.app.goo.gl/abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /좌표 채우기/ }));

    await waitFor(() =>
      expect((screen.getByLabelText('위도') as HTMLInputElement).value).toBe('26.5'),
    );
    expect((screen.getByLabelText('경도') as HTMLInputElement).value).toBe('127.9');

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/resolve-map');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ url: 'https://maps.app.goo.gl/abc' });
  });

  it('링크가 비어 있으면 좌표 채우기는 호출하지 않는다', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<AdminForm initial={initial} />); // i1 은 url 없음
    fireEvent.click(screen.getByRole('button', { name: /좌표 채우기/ }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('409 면 충돌 안내를 보여준다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: '충돌' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminForm initial={initial} />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(
      await screen.findByText('다른 곳에서 일정이 바뀌었어요. 새로고침 후 다시 저장해 주세요'),
    ).toBeInTheDocument();
  });
});
