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
    <p className="mt-1 flex items-center gap-2 text-body text-ink/85">
      <span className="text-gold-gradient font-semibold">다음 ▸</span>
      <span className="font-semibold text-ink">{title}</span>
      <span className="tabular-nums text-ink-muted">{time}</span>
    </p>
  );
}

export function StatusCard({ itinerary, now }: Props) {
  const phase = getEventPhase(itinerary, now);
  const { current, next } = findCurrentAndNext(itinerary, now);

  // 진행 중(라이브)일 때만 코랄 글로우 — 그 외엔 차분한 골드 글래스.
  const isLive = phase === 'during' && !!current;

  return (
    <section
      data-testid="status-card"
      className={[
        'glass animate-fade-up relative overflow-hidden rounded-3xl p-6',
        isLive ? 'shadow-glow-coral' : 'shadow-glass',
      ].join(' ')}
    >
      {/* 좌측 강조 바 — 라이브면 선셋 그라데이션, 아니면 골드. */}
      <span
        aria-hidden
        className={[
          'absolute inset-y-0 left-0 w-1.5',
          isLive ? 'bg-sunset-gradient' : 'bg-gold-gradient',
        ].join(' ')}
      />
      {/* 우상단 빛 반사 하이라이트. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-glass-sheen blur-2xl"
      />

      {phase === 'before' && (
        <div className="flex flex-col gap-1.5 pl-2">
          <span className="text-meta font-semibold uppercase tracking-[0.2em] text-gold">
            🎉 곧 시작해요
          </span>
          <p className="text-status font-bold text-ink">행사 시작 전이에요</p>
        </div>
      )}

      {phase === 'after' && (
        <div className="flex flex-col gap-1.5 pl-2">
          <span className="text-meta font-semibold uppercase tracking-[0.2em] text-gold">
            🌅 마무리
          </span>
          <p className="text-status font-bold text-ink">
            모든 일정이 끝났어요. 함께해 주셔서 고맙습니다
          </p>
        </div>
      )}

      {phase === 'during' && current && (
        <div className="flex flex-col gap-2.5 pl-2">
          <span className="flex w-fit items-center gap-2 rounded-full bg-sunset-gradient px-3.5 py-1.5 text-meta font-bold text-night-deep shadow-glow-coral">
            <span className="live-dot" aria-hidden />
            지금 진행 중
          </span>
          <p className="text-status font-extrabold leading-tight text-ink">{current.item.title}</p>
          <p className="text-body text-ink-muted">
            <span className="tabular-nums text-gold">
              {current.item.startTime}
              {current.item.endTime ? `–${current.item.endTime}` : ''}
            </span>
            {current.item.location ? ` · ${current.item.location}` : ''}
          </p>
          {next && <NextPreview title={next.item.title} time={next.item.startTime} />}
        </div>
      )}

      {phase === 'during' && !current && next && (
        <div className="flex flex-col gap-2 pl-2">
          <span className="text-meta font-semibold uppercase tracking-[0.2em] text-gold">
            다음 일정
          </span>
          <p className="text-status font-extrabold leading-tight text-ink">{next.item.title}</p>
          <p className="text-body text-ink-muted">
            <span className="tabular-nums text-gold">{next.item.startTime}</span>
            {next.item.location ? ` · ${next.item.location}` : ''}
          </p>
        </div>
      )}
    </section>
  );
}
