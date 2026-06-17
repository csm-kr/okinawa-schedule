// 환갑잔치 안내 PWA service worker.
// - 앱 셸(해시된 정적 자원·아이콘·manifest): cache-first (빠르게).
// - 그 밖(`/`·`/admin` 내비게이션, `/api/itinerary` 데이터): network-first(캐시 폴백).
//   이유: 일정은 KV 가 단일 진실 공급원 — cache-first 면 편집 반영이 지연된다(STATE).
// 캐시 이름에 버전을 박고 activate 에서 옛 캐시를 비워, 빌드 간 낡은 셸이 고착되지 않게 한다.
const VERSION = 'v1';
const CACHE = `hwangab-${VERSION}`;

self.addEventListener('install', () => {
  // 새 SW 를 즉시 활성화 대기 없이 적용한다(낡은 셸 고착 방지).
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// 해시된 빌드 자원·아이콘·manifest 만 앱 셸로 본다. 나머지는 데이터로 취급(network-first).
function isAppShell(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/manifest.json'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isAppShell(url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
