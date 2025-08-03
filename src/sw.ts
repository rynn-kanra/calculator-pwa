/// <reference lib="webworker" />

const isDev = false;
const CACHE_NAME = 'preact-calculator-cache-v1';
const FILES_TO_CACHE = [
    './index.html',
    './manifest.json',
    './assets/images/icon.png',
    './index.js',
    './assets/audio/click-in.mp3',
    './index.css',
];

const sw = self as unknown as ServiceWorkerGlobalScope;
sw.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            Promise.all(
                FILES_TO_CACHE.map(file => (async () => {
                    const cached = await cache.match(file);
                    if (!cached) {
                        const response = await fetch(file);
                        if (response.ok) {
                            if (file == "./index.html") {
                                const copy = response.clone();
                                await cache.put("./", copy);
                            }
                            await cache.put(file, response);
                        }
                    }
                })())
            );
        })
    );
    sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
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
    sw.clients.claim();
});

sw.addEventListener('fetch', (event) => {
    if (isDev) {
        return;
    }

    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.origin) {
        return;
    }

    if (requestUrl.pathname.endsWith("/index.js")) {
        // always try network for index.js
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 5000);
        event.respondWith(
            fetch(event.request, { signal: controller.signal })
                .then(async (response) => {
                    if (response.type == "basic") {
                        if (response.status == 200) {
                            // update cache with latest version
                            const copy = response.clone();
                            const cache = await caches.open(CACHE_NAME)
                            cache.put(event.request, copy);
                        }
                        else if (response.status >= 400) {
                            const d = await caches.match(event.request);
                            if (d) {
                                return d;
                            }
                        }
                    }

                    return response;
                })
                .catch(() => {
                    // Offline fallback
                    return caches.match(event.request) as Promise<Response>;
                })
                .finally(() => {
                    clearTimeout(t);
                })
        );
        return;
    }

    // always use cache for other files
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise fetch from network
            return fetch(event.request).then(networkResponse => {
                // Cache the new response for future requests
                return caches.open(CACHE_NAME).then(cache => {
                    // Clone the response because response streams can only be read once
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});

sw.addEventListener('backgroundfetchsuccess', (event: BackgroundFetchUpdateUIEvent) => {
    event.waitUntil((async () => {
        const records = await event.registration.matchAll();
        const cache = await caches.open(CACHE_NAME);

        // Copy each request/response across.
        const promises = records.map(async (record) => {
            const response = await record.responseReady;
            await cache.put(record.request, response);
        });

        // Wait for the copying to complete.
        await Promise.all(promises);

        // Update the progress notification.
        event.updateUI({ title: `download completed` });

        const clients = await sw.clients.matchAll();
        for (const client of clients) {
            client.postMessage({ type: 'DOWNLOAD', status: true, id: event.registration.id });
        }
    })());
});
sw.addEventListener('backgroundfetchfail', async (event: BackgroundFetchUpdateUIEvent) => {
    event.updateUI({ title: `download failed` });

    const clients = await sw.clients.matchAll();
    for (const client of clients) {
        client.postMessage({ type: 'DOWNLOAD', status: false, id: event.registration.id });
    }
});