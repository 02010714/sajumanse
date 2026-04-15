// 에너지 코드 앱 Service Worker
// 버전을 올리면 캐시가 갱신됩니다
const CACHE_NAME = 'energycode-v1';

// 캐시할 핵심 파일 목록
const CORE_ASSETS = [
  '/InnerME.html',
  '/manifest.json'
];

// ── 설치: 핵심 파일 캐시 ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── 활성화: 이전 버전 캐시 삭제 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── 요청 처리: Network First (온라인 우선, 실패 시 캐시) ──
self.addEventListener('fetch', event => {
  // 외부 도메인 요청(카카오SDK 등)은 그냥 통과
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 정상 응답이면 캐시에도 저장
        if (response && response.status === 200 && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => {
        // 오프라인이면 캐시에서 응답
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // 캐시도 없으면 메인 페이지로 폴백
          return caches.match('/InnerME.html');
        });
      })
  );
});
