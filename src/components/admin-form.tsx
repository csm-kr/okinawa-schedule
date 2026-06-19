// 관리자 편집(SCREENS 화면3) — 날짜 탭 + 항목 인라인 편집(시각/제목/장소/메모), 추가·삭제, 저장.
// 로드 시 version 을 보관해 PUT 에 expectedVersion 으로 보낸다(R5 낙관적 동시성). 데이터 쓰기는
// 서버 route(PUT /api/itinerary)가 쿠키를 검증한다(R3). 편집 목록은 입력 순서 유지(드래그 정렬 없음);
// 가족이 보는 공개 타임라인은 시각순으로 자동 정렬된다(TimelineList).
'use client';

import { useState } from 'react';
import type { Day, Itinerary, ScheduleItem } from '@/types/itinerary';
import { DayTabs } from './day-tabs';

const CONFLICT_MESSAGE = '다른 곳에서 일정이 바뀌었어요. 새로고침 후 다시 저장해 주세요';

type SaveState = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

function newItem(): ScheduleItem {
  return { id: crypto.randomUUID(), startTime: '09:00', title: '' };
}

export function AdminForm({ initial }: { initial: Itinerary }) {
  const [days, setDays] = useState<Day[]>(initial.days);
  const [title, setTitle] = useState(initial.title);
  const [version, setVersion] = useState(initial.version);
  const [selectedId, setSelectedId] = useState(initial.days[0]?.id ?? '');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [geoBusy, setGeoBusy] = useState<string | null>(null); // 좌표 찾는 중인 itemId
  const [geoErr, setGeoErr] = useState<string | null>(null); // 좌표 실패한 itemId

  const selectedDay = days.find((d) => d.id === selectedId) ?? days[0];

  function patchItem(itemId: string, patch: Partial<ScheduleItem>): void {
    setSaveState('idle');
    setDays((prev) =>
      prev.map((d) =>
        d.id === selectedDay.id
          ? { ...d, items: d.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
          : d,
      ),
    );
  }

  function addItem(): void {
    setSaveState('idle');
    setDays((prev) =>
      prev.map((d) => (d.id === selectedDay.id ? { ...d, items: [...d.items, newItem()] } : d)),
    );
  }

  function removeItem(itemId: string): void {
    if (!window.confirm('이 일정을 삭제할까요?')) return; // R6 — 파괴적 작업은 명시적 확인
    setSaveState('idle');
    setDays((prev) =>
      prev.map((d) =>
        d.id === selectedDay.id ? { ...d, items: d.items.filter((it) => it.id !== itemId) } : d,
      ),
    );
  }

  // 링크(구글맵 URL)에서 위도·경도를 추출해 채운다. 단축링크는 서버가 리다이렉트를 펼친다.
  async function fillCoordsFromUrl(item: ScheduleItem): Promise<void> {
    const url = item.url?.trim();
    if (!url) return;
    setGeoErr(null);
    setGeoBusy(item.id);
    try {
      const res = await fetch('/api/resolve-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        setGeoErr(item.id);
        return;
      }
      const { data } = (await res.json()) as { data: { lat: number; lng: number } };
      patchItem(item.id, { lat: data.lat, lng: data.lng });
    } catch {
      setGeoErr(item.id);
    } finally {
      setGeoBusy(null);
    }
  }

  async function handleSave(): Promise<void> {
    setSaveState('saving');
    const next: Itinerary = { ...initial, title, days, version };
    const res = await fetch('/api/itinerary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itinerary: next, expectedVersion: version }),
    });
    if (res.status === 409) {
      setSaveState('conflict');
      return;
    }
    if (!res.ok) {
      setSaveState('error');
      return;
    }
    const { data } = (await res.json()) as { data: Itinerary };
    setVersion(data.version);
    setDays(data.days);
    setSaveState('saved');
  }

  if (!selectedDay) {
    return <p className="text-body text-ink-muted">아직 등록된 날짜가 없어요</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 맨 위 행사 제목(공개 화면 헤더에 그대로 노출). 저장된 title 을 직접 편집한다. */}
      <input
        type="text"
        aria-label="행사 제목"
        placeholder="행사 제목"
        value={title}
        onChange={(e) => {
          setSaveState('idle');
          setTitle(e.target.value);
        }}
        className="min-h-12 rounded-xl border border-line bg-surface px-4 text-body font-semibold text-ink"
      />

      <DayTabs days={days} selectedId={selectedDay.id} onSelect={setSelectedId} />

      <ol className="flex flex-col gap-4">
        {selectedDay.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <input
                type="time"
                aria-label="시각"
                value={item.startTime}
                onChange={(e) => patchItem(item.id, { startTime: e.target.value })}
                className="min-h-12 rounded-xl border border-line bg-surface px-3 text-body text-ink"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="ml-auto min-h-12 rounded-xl border border-line px-4 text-body text-ink-muted"
              >
                삭제
              </button>
            </div>
            <input
              type="text"
              aria-label="제목"
              placeholder="제목"
              value={item.title}
              onChange={(e) => patchItem(item.id, { title: e.target.value })}
              className="min-h-12 rounded-xl border border-line bg-surface px-3 text-body text-ink"
            />
            <input
              type="text"
              aria-label="장소"
              placeholder="장소"
              value={item.location ?? ''}
              onChange={(e) => patchItem(item.id, { location: e.target.value })}
              className="min-h-12 rounded-xl border border-line bg-surface px-3 text-body text-ink"
            />
            <input
              type="text"
              aria-label="메모"
              placeholder="메모"
              value={item.note ?? ''}
              onChange={(e) => patchItem(item.id, { note: e.target.value })}
              className="min-h-12 rounded-xl border border-line bg-surface px-3 text-body text-ink"
            />
            {/* 동선 지도용 좌표(선택). 비우면 지도에 안 뜬다. */}
            <div className="flex gap-3">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                aria-label="위도"
                placeholder="위도"
                value={item.lat ?? ''}
                onChange={(e) =>
                  patchItem(item.id, { lat: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-body text-ink"
              />
              <input
                type="number"
                step="any"
                inputMode="decimal"
                aria-label="경도"
                placeholder="경도"
                value={item.lng ?? ''}
                onChange={(e) =>
                  patchItem(item.id, { lng: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-body text-ink"
              />
            </div>
            <input
              type="url"
              aria-label="링크"
              placeholder="링크(지도 URL) — 🔗 새 탭"
              value={item.url ?? ''}
              onChange={(e) => patchItem(item.id, { url: e.target.value === '' ? undefined : e.target.value })}
              className="min-h-12 rounded-xl border border-line bg-surface px-3 text-body text-ink"
            />
            <button
              type="button"
              onClick={() => fillCoordsFromUrl(item)}
              disabled={geoBusy === item.id}
              className="min-h-12 rounded-xl border border-line px-4 text-meta font-medium text-ink-muted disabled:opacity-60"
            >
              {geoBusy === item.id ? '좌표 찾는 중…' : '📍 링크에서 좌표 채우기'}
            </button>
            {geoErr === item.id && (
              <p role="alert" className="text-meta text-coral-strong">
                링크에서 좌표를 못 찾았어요. 링크를 확인해 주세요
              </p>
            )}
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={addItem}
        className="min-h-12 rounded-xl border border-ink px-5 text-body font-semibold text-ink"
      >
        + 일정 추가
      </button>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-line bg-cream px-4 pb-4 pt-3">
        {saveState === 'saved' && (
          <p role="status" className="text-body font-semibold text-ink">
            저장됐어요
          </p>
        )}
        {saveState === 'conflict' && (
          <p role="alert" className="text-body font-semibold text-coral-strong">
            {CONFLICT_MESSAGE}
          </p>
        )}
        {saveState === 'error' && (
          <p role="alert" className="text-body font-semibold text-coral-strong">
            저장하지 못했어요. 다시 시도해 주세요
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="h-14 rounded-xl bg-coral-strong px-5 text-body font-semibold text-white disabled:opacity-60"
        >
          저장
        </button>
      </div>
    </div>
  );
}
