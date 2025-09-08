import { CACHE_NAME } from "../Utility/config";

class DownloadService {
    private _swReg?: ServiceWorkerRegistration;
    protected missingFiles(files: string[]) {
        return Promise.all(
            files.map(o => caches.match(o).then(p => ({
                url: o,
                cache: p
            })))
        ).then(os => os.filter(p => !p.cache).map(p => p.url));
    }
    public async download(id: string, files: string[], options: BackgroundFetchOptions) {
        if (!this._swReg) {
            this._swReg = await navigator.serviceWorker.ready;
        }
        if ('backgroundFetch' in this._swReg) {
            await this.bgFetchDownload(id, files, options);
        }
        else {
            const p = await Notification.requestPermission();
            if (p === "granted") {
                await this.notificationDownload(id, files, options);
                return;
            }

            console.log("permission not granted. fallback to fetch");
            await this.fetchDownload(files);
        }
    }
    public async notifHandler(sw: ServiceWorkerGlobalScope, id: string, files: string[], option: BackgroundFetchOptions) {
        if (!Array.isArray(files) || files.length <= 0) {
            return;
        }

        await sw.registration.showNotification(option.title ?? "Download Files", {
            body: `downloading ${files.length} files...`,
            icon: option.icons?.map(o => o.src)?.[0]
        });

        const clients = await sw.clients.matchAll();
        try {
            const cache = await caches.open(CACHE_NAME);
            await Promise.all(
                files.map(file => (async () => {
                    const cached = await cache.match(file);
                    if (!cached) {
                        const response = await fetch(file);
                        if (response.ok) {
                            await cache.put(file, response);
                        }
                    }
                })())
            );

            await sw.registration.showNotification("download completed", {
                icon: option.icons?.map(o => o.src)?.[0]
            });

            const clients = await sw.clients.matchAll();
            for (const client of clients) {
                client.postMessage({ type: 'DOWNLOAD', status: true, id: id });
            }
        }
        catch (e) {
            for (const client of clients) {
                client.postMessage({ type: 'DOWNLOAD', status: false, id: id });
            }
        }
    }
    public async notificationDownload(id: string, files: string[], options: BackgroundFetchOptions) {
        files = await this.missingFiles(files);
        navigator.serviceWorker.controller?.postMessage({
            action: "BackgroundFeth",
            params: [
                id,
                files,
                options
            ]
        });
    }
    private async fetchDownload(files: string[]) {
        files = await this.missingFiles(files);
        return Promise.all(files.map(file => fetch(file)));
    }
    private async bgFetchDownload(id: string, files: string[], options: BackgroundFetchOptions) {
        if (!this._swReg) {
            this._swReg = await navigator.serviceWorker.ready;
        }
        files = await this.missingFiles(files);

        const existing = await this._swReg.backgroundFetch.get(id);
        if (existing) {
            await existing.abort();
        }

        await this._swReg.backgroundFetch.fetch(id, files, options);
    }
}

const instance = new DownloadService();
export default instance;