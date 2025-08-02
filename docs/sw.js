// src/sw.ts
var CACHE_NAME = "preact-calculator-cache-v1";
var FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./assets/images/icon.png",
  "./index.js",
  "./assets/audio/click-in.mp3",
  "./index.css"
];
var sw = self;
sw.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
    Promise.all(FILES_TO_CACHE.map((file) => (async () => {
      const cached = await cache.match(file);
      if (!cached) {
        const response = await fetch(file);
        if (response.ok) {
          await cache.put(file, response);
          if (file == "./index.html") {
            await cache.put("./", response);
          }
        }
      }
    })()));
  }));
  sw.skipWaiting();
});
sw.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(caches.keys().then((keyList) => Promise.all(keyList.map((key) => {
    if (key !== CACHE_NAME) {
      console.log("[SW] Deleting old cache:", key);
      return caches.delete(key);
    }
  }))));
  sw.clients.claim();
});
sw.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.origin) {
    return;
  }
  if (requestUrl.pathname.endsWith("/index.js")) {
    const controller = new AbortController;
    const t = setTimeout(() => controller.abort(), 5000);
    event.respondWith(fetch(event.request, { signal: controller.signal }).then(async (response) => {
      if (response.type == "basic") {
        if (response.status == 200) {
          const copy = response.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, copy);
        } else if (response.status >= 400) {
          const d = await caches.match(event.request);
          if (d) {
            return d;
          }
        }
      }
      return response;
    }).catch(() => {
      return caches.match(event.request);
    }).finally(() => {
      clearTimeout(t);
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse;
    }
    return fetch(event.request).then((networkResponse) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      });
    });
  }));
});
