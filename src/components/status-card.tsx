// 현재 상태 카드 — 진입 즉시(스크롤 없이) "지금/다음 / 기간 전·후"를 큰 글씨(26/700)로(SCREENS).
// findCurrentAndNext·getEventPhase 결과로 분기. 살구는 면(바·뱃지)에만.
import type { Itinerary } from '@/types/itinerary';
import { findCurrentAndNext, getEventPhase } from '@/lib/status';

type Props = {
  itinerary: Itinerary;
  now: Date;
};

function NextPreview({ title, time }: { title: string; time: string }) {
  return (
    <p className="text-body text-ink">
      다음 ▸ <span className="font-semibold">{title}</span>{' '}
      <span className="tabular-nums">{time}</span>
    </p>
  );
}

export function StatusCard({ itinerary, now }: Props) {
  const phase = getEventPhase(itinerary, now);
  const { current, next } = findCurrentAndNext(itinerary, now);

  return (
    <section
      data-testid="status-card"
      className="rounded-2xl border-l-4 border-coral bg-surface p-5 shadow-sm"
    >
      {phase === 'before' && <p className="text-status font-bold text-ink">행사 시작 전이에요</p>}

      {phase === 'after' && (
        <p className="text-status font-bold text-ink">
          모든 일정이 끝났어요. 함께해 주셔서 고맙습니다
        </p>
      )}

      {phase === 'during' && current && (
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-coral px-3 py-1 text-meta font-semibold text-white">
            지금 진행 중
          </span>
          <p className="text-status font-bold text-ink">{current.item.title}</p>
          <p className="text-body text-ink-muted">
            <span className="tabular-nums">
              {current.item.startTime}
              {current.item.endTime ? `–${current.item.endTime}` : ''}
            </span>
            {current.item.location ? ` · ${current.item.location}` : ''}
          </p>
          {next && <NextPreview title={next.item.title} time={next.item.startTime} />}
        </div>
      )}

      {phase === 'during' && !current && next && (
        <div className="flex flex-col gap-2">
          <span className="text-body text-ink-muted">다음 일정</span>
          <p className="text-status font-bold text-ink">{next.item.title}</p>
          <p className="text-body text-ink-muted">
            <span className="tabular-nums">{next.item.startTime}</span>
            {next.item.location ? ` · ${next.item.location}` : ''}
          </p>
        </div>
      )}
    </section>
  );
}
