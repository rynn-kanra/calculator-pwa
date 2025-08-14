/// <reference lib="webworker" />

import DownloadService from "./Services/DownloadService";
import { CACHE_NAME, FILES_TO_CACHE } from "./Utility/config";

const shareTargetMessages: any[] = [];
const clientIds = new Set<string>();

const getClients = async () => {
    let clients: WindowClient[] = [];
    if (clientIds.size > 0) {
        const d = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients = d.filter(o => clientIds.has(o.id));
    }
    return clients;
}

const sw = self as unknown as ServiceWorkerGlobalScope;
sw.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            Promise.all(
                FILES_TO_CACHE.map(file => (async () => {
                    const cached = await cache.match(file);
                    if (!cached) {
                        const response = await fetch(file);
                        if (response.ok && !response.redirected) {
                            await cache.put(file, response.clone());
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
    const requestUrl = new URL(event.request.url);

    if (requestUrl.pathname === '/share' && event.request.method === 'POST') {
        event.respondWith((async () => {
            const formData = await event.request.formData();

            const sharedTitle = formData.get('title');
            const sharedText = formData.get('text');
            const sharedUrl = formData.get('url');
            const sharedImage = formData.get('image') as File;

            let clients = await getClients();
            const pushData = {
                type: 'SHARE',
                title: sharedTitle,
                text: sharedText,
                url: sharedUrl,
                image: sharedImage
            };
            if (clients.length <= 0) {
                shareTargetMessages.push(pushData);
            }
            else {
                for (const client of clients) {
                    client.postMessage(pushData);
                }
            }

            return Response.redirect('/?shared=1', 303);
        })());
        return;
    }

    if (event.request.method !== 'GET') {
        return;
    }

    if (requestUrl.origin !== self.origin) {
        return;
    }

    if (requestUrl.pathname.endsWith("/index.js") || requestUrl.pathname.endsWith("/index.css")) {
        // always try network for index.js
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 5000);
        event.respondWith(
            fetch(event.request, { signal: controller.signal })
                .then(async (response) => {
                    if (response.type == "basic") {
                        if (response.status == 200) {
                            // update cache with latest version
                            const reponseClone = response.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(event.request, reponseClone));
                        }
                        else if (response.status >= 400) {
                            const d = await caches.match(event.request);
                            if (d) {
                                return d.clone();
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
        caches.match(event.request).then(async cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise fetch from network
            return fetch(event.request).then(response => {
                if (response.status == 200 && !response.redirected) {
                    const responseClone = response.clone();
                    // Cache the new response for future requests
                    return caches.open(CACHE_NAME).then(cache => {
                        // Clone the response because response streams can only be read once
                        cache.put(event.request, responseClone);
                        return response;
                    });
                }

                return response;
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

const messageAction: { [key in string]: (...params: any[]) => Promise<void> } = {
    BackgroundFeth: async (event: ExtendableMessageEvent, id: string, files: string[], options: BackgroundFetchOptions) => {
        DownloadService.notifHandler(sw, id, files, options);
    },
    ready: async (event: ExtendableMessageEvent) => {
        if (event.source instanceof Client) {
            clientIds.add(event.source.id);
        }

        const clients = await getClients();
        if (shareTargetMessages.length > 0 && clients.length > 0) {
            const d = shareTargetMessages.splice(0, shareTargetMessages.length);
            for (const pm of d) {
                for (const client of clients) {
                    client.postMessage(pm);
                }
            }
        }
    }
};
sw.addEventListener('message', (event) => {
    if (!event.data?.action) {
        return;
    }

    const action = event.data.action;
    const params = event.data.params || [];
    const fn = messageAction[action];
    if (fn) {
        fn.call(null, event, ...params);
    }
});