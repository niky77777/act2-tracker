// service-worker.js — safe bootstrap
const CACHE_NAME = 'besti-cache-v3-1';

// Активира се веднага, без да чака
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Поема контрол веднага
self.addEventListener('activate', (e) => {
  self.clients.claim();
});

// Опционален кеш-first за собствени ресурси (без предварително addAll)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const resp = await fetch(e.request);
        // кеширай само успешни отговори
        if (resp && resp.status === 200 && resp.type === 'basic') {
          cache.put(e.request, resp.clone());
        }
        return resp;
      })
    );
  }
});
