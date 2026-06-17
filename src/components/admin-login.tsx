// 관리자 로그인(SCREENS 화면2) — 공용 비밀번호 입력 → POST /api/admin/login.
// 인증 판단은 서버(쿠키)가 한다(R3). 성공 시 router.refresh 로 서버 재렌더해 편집 화면으로 전환.
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.refresh();
      return;
    }
    setError(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="family-password" className="text-body font-semibold text-ink">
        가족 비밀번호
      </label>
      <input
        id="family-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={error}
        className={[
          'min-h-12 rounded-xl border bg-surface px-4 text-body text-ink',
          error ? 'animate-shake border-coral-strong' : 'border-line',
        ].join(' ')}
      />
      {error && (
        <p role="alert" className="text-body font-semibold text-coral-strong">
          비밀번호가 달라요
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="h-14 rounded-xl bg-coral-strong px-5 text-body font-semibold text-white disabled:opacity-60"
      >
        들어가기
      </button>
    </form>
  );
}
