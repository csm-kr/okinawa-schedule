// PWA service worker 등록 — 마운트 시 한 번 `/sw.js` 를 등록한다.
// 데이터 접근 없음(클라이언트 전용). SW 미지원 환경에서는 조용히 건너뛴다.
'use client';

import { useEffect } from 'react';

export function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // 등록 실패는 무시한다 — 앱은 SW 없이도 동작한다.
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return null;
}
