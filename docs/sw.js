const CACHE_NAME = 'preact-calculator-cache-v1';
const FILES_TO_CACHE = [
  '',
  'manifest.json',
  'assets/images/icon.png',
  'sw.js',
  'index.js',
  'assets/click-in.mp3',
  'index.css',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Optionally: update cache with latest version
        if (response.type == "basic") {
          if (response.status == 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          else if (response.status >= 400) {
            if (caches.has(event.request)) {
              // Offline fallback
              return caches.match(event.request);
            }
          }
        }

        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request);
      })
  );
});
