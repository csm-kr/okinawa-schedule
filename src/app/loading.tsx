// 첫 진입 로딩 스켈레톤(SCREENS — 타임라인 스켈레톤). 헤더·상태 카드·탭·리스트 형태만 암시.
export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-4 pb-16 pt-6">
      <div className="h-8 w-2/3 animate-pulse rounded bg-line" />
      <div className="h-28 animate-pulse rounded-2xl bg-line" />
      <div className="flex gap-2">
        <div className="h-12 flex-1 animate-pulse rounded bg-line" />
        <div className="h-12 flex-1 animate-pulse rounded bg-line" />
        <div className="h-12 flex-1 animate-pulse rounded bg-line" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-line" />
        ))}
      </div>
    </main>
  );
}
