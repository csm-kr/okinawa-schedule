// 데이터 로드 실패 화면(SCREENS 카피). error.tsx 는 클라이언트 컴포넌트여야 한다.
'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-status font-bold text-ink">일정을 불러오지 못했어요</p>
      <button
        type="button"
        onClick={reset}
        className="min-h-14 rounded-xl bg-coral-strong px-6 text-body font-semibold text-white"
      >
        다시 시도
      </button>
    </main>
  );
}
