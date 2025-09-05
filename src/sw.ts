/// <reference lib="webworker" />

import { AutoUpdateMode } from "./Model/CalculatorConfig";
import DownloadService from "./Services/DownloadService";
import IdentityService from "./Services/IdentityService";
import LocalDBService, { VersionData } from "./Services/LocalDBService";
import { CACHE_NAME } from "./Utility/config";

type MessageAction = {
    action: string,
    params?: any[]
}

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

const getLatestVersion = async () => {
    const versionResponse = await fetch("./assets/data/version.json", { cache: "no-cache" });
    return await versionResponse.json() as VersionData;
}

const installVersion = async (version: VersionData, isFull: boolean = false) => {
    const cache = await caches.open(CACHE_NAME);
    let fetchFiles = version.app_files.map(file => (async () => {
        const response = await fetch(file, { cache: "no-cache" });
        if (response.ok && !response.redirected) {
            await cache.put(file, response.clone());
        }
    })());
    fetchFiles.splice(fetchFiles.length, 0, ...version.assets.map(file => (async () => {
        const response = await fetch(file, { cache: isFull ? "no-cache" : "default" });
        if (response.ok && !response.redirected) {
            await cache.put(file, response.clone());
        }
    })()));
    await Promise.all(fetchFiles);
    await LocalDBService.set("version", version);
    await deleteOldCache(version);
}
const deleteOldCache = async (version: VersionData) => {
    const cache = await caches.open(CACHE_NAME);
    const appPathes = version.app_files.map(o => new URL(o, sw.location.href).pathname?.toLowerCase());
    const keys = await cache.keys();
    const deletes = keys.map(async key => {
        const url = new URL(key.url);
        const path = url?.pathname?.toLowerCase();
        if ((!path.includes(".chunk.") && !path.includes("chunk-")) || appPathes.includes(path)) {
            return;
        }

        await cache.delete(key);
    });
    await Promise.all(deletes);
}

const checkUpdate = async () => {
    const setting = await LocalDBService.get("setting");
    if (setting.autoUpdate == AutoUpdateMode.checkDaily) {
        let lastCheck = await LocalDBService.get("lastCheck");
        if (!lastCheck || (lastCheck.getTime() + 24 * 60 * 60 * 1000) < Date.now()) {
            IdentityService.pushMessage({
                payload: JSON.stringify({
                    action: "UPDATE:CHECK"
                })
            });
            lastCheck = new Date();
            await LocalDBService.set("lastCheck", lastCheck);
        }

        setTimeout(checkUpdate, (lastCheck.getTime() + 24 * 60 * 60 * 1000) - Date.now());
    }
};
checkUpdate();

const actionHandlers: { [key in string]: (...params: any[]) => Promise<void> } = {
    BackgroundFeth: async (event: ExtendableMessageEvent, id: string, files: string[], options: BackgroundFetchOptions) => {
        DownloadService.notifHandler(sw, id, files, options);
    },
    ready: async (event: ExtendableMessageEvent) => {
        if (event.source instanceof Client) {
            clientIds.add(event.source.id);
        }
    },
    handleShare: async (event: ExtendableMessageEvent) => {
        const clients = await getClients();
        if (shareTargetMessages.length > 0 && clients.length > 0) {
            const d = shareTargetMessages.splice(0, shareTargetMessages.length);
            for (const pm of d) {
                for (const client of clients) {
                    client.postMessage(pm);
                }
            }
        }
    },
    "UPDATE:CHECK": async (showNoUpdate: boolean = false) => {
        const currentVersion = await LocalDBService.get("version");
        const latestVersion = await getLatestVersion();
        if (currentVersion?.version != latestVersion.version) {
            await sw.registration.showNotification("Versi baru tersedia", {
                body: `Printer Calculator: versi ${latestVersion.version}`,
                icon: "./assets/images/icon.192.png",
                requireInteraction: true,
                data: {
                    action: "UPDATE:INSTALL",
                    params: [latestVersion]
                } as MessageAction,
                actions: [
                    { action: 'cancel', title: 'Cancel' },
                    { action: 'update', title: 'Update' }
                ],
                dir: "ltr",
                lang: "id-ID",
                silent: false,
                badge: undefined,
                tag: undefined
            });
        }
        else if (showNoUpdate) {
            await sw.registration.showNotification("Belum ada versi baru", {
                body: `Printer Calculator: versi ${currentVersion.version}`,
                icon: "./assets/images/icon.192.png",
                requireInteraction: false,
                dir: "ltr",
                lang: "id-ID",
                silent: false,
                badge: undefined,
                tag: undefined
            });
        }
    },
    "UPDATE:INSTALL": async (action, version: VersionData) => {
        if (action == "cancel") {
            return;
        }

        await installVersion(version, true);
    }
};
const executeAction = async (msgAction: MessageAction) => {
    const action = msgAction.action;
    const params = msgAction.params || [];
    const fn = actionHandlers[action];
    if (fn) {
        await fn.call(null, ...params);
    }
};

const sw = self as unknown as ServiceWorkerGlobalScope;
sw.addEventListener('install', (event: ExtendableEvent) => {
    console.log('[SW] install');
    event.waitUntil(
        getLatestVersion().then(version => installVersion(version))
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

sw.addEventListener('push', (event) => {
    console.log(event);
    if (!event.data) {
        return;
    }

    const data = event.data.json() as MessageAction;
    executeAction(data);
});

let silentCleanTO: number;
sw.addEventListener('fetch', (event) => {
    let request = event.request;
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === '/' && request.method === 'POST') {
        event.respondWith((async () => {
            const formData = await request.formData();

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

            return Response.redirect('./#/ocr?share=image', 303);
        })());
        return;
    }

    if (request.method !== 'GET') {
        return;
    }

    if (!request.destination) {
        return;
    }

    if (requestUrl.origin !== self.origin) {
        return;
    }

    let modifyRequest = false;
    if (requestUrl.pathname === "/index.html") {
        modifyRequest = true;
        requestUrl.pathname = "/";
    }
    if (requestUrl.searchParams.has("sw")) {
        requestUrl.searchParams.delete("sw");
        modifyRequest = true;
    }
    if (modifyRequest) {
        request = new Request(requestUrl.toString(), {
            method: request.method,
            headers: request.headers,
            credentials: request.credentials,
            redirect: request.redirect,
            referrer: request.referrer,
            referrerPolicy: request.referrerPolicy,
            integrity: request.integrity,
            cache: request.cache
        });
    }

    // always use cache for other files
    event.respondWith(
        LocalDBService.get("setting").then(setting => {
            if (setting.autoUpdate == AutoUpdateMode.alwaysOnline) {
                console.log(request.url);
                return fetch(request, { cache: "no-cache" }).then(response => {
                    if (response.type == "basic" && response.status == 200) {
                        // update cache with latest version
                        const reponseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, reponseClone));
                    }

                    return response;
                });
            }

            return caches.match(request).then(async cachedResponse => {
                let freshResponse: Promise<Response> | undefined = undefined;
                let requireFetch = !cachedResponse;
                if (!requireFetch && setting.autoUpdate == AutoUpdateMode.silent) {
                    const version = await LocalDBService.get("version");
                    requireFetch = version?.app_files?.some(o => requestUrl.pathname?.toLowerCase() == new URL(o, sw.location.href).pathname?.toLowerCase()) == true;
                }
                if (requireFetch) {
                    // Otherwise fetch from network
                    const controller = new AbortController();
                    const t = setTimeout(() => controller.abort(), 2000);
                    console.log(request.url);
                    const reqOption: RequestInit = {
                        signal: controller.signal
                    };
                    if (setting.autoUpdate == AutoUpdateMode.silent) {
                        reqOption.cache = "no-cache";
                        if (cachedResponse) {
                            const eTag = cachedResponse.headers.get("ETag");
                            if (eTag) {
                                reqOption.headers = {
                                    "If-None-Match": eTag
                                };
                            }
                        }
                    }
                    freshResponse = fetch(request, reqOption).then(response => {
                        if (response.type == "basic" && response.status == 200) {
                            // update cache with latest version
                            const reponseClone = response.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(request, reponseClone));
                            if (cachedResponse) {
                                clearTimeout(silentCleanTO);
                                silentCleanTO = setTimeout(() => {
                                    getLatestVersion().then(async version => {
                                        await LocalDBService.set("version", version);
                                        await deleteOldCache(version);
                                    });
                                }, 1000) as unknown as number;
                            }
                        }

                        return response;
                    }).finally(() => {
                        clearTimeout(t);
                    });
                }

                if (!cachedResponse) {
                    cachedResponse = await freshResponse!;
                }

                return cachedResponse;
            })
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
            client.postMessage({ action: 'DOWNLOAD', status: true, id: event.registration.id });
        }
    })());
});
sw.addEventListener('backgroundfetchfail', async (event: BackgroundFetchUpdateUIEvent) => {
    event.updateUI({ title: `download failed` });

    const clients = await sw.clients.matchAll();
    for (const client of clients) {
        client.postMessage({ action: 'DOWNLOAD', status: false, id: event.registration.id });
    }
});

sw.addEventListener('message', (event) => {
    if (!event.data?.action) {
        return;
    }

    const msgAction = event.data as MessageAction;
    msgAction.params = (msgAction.params || []);
    msgAction.params.unshift(event);
    executeAction(msgAction);
});
sw.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Close the notification

    const msgAction = event.notification.data as MessageAction;
    if (!msgAction) {
        return;
    }
    msgAction.params = (msgAction.params || []);
    msgAction.params.unshift(event.action ?? "");
    executeAction(msgAction);
});
