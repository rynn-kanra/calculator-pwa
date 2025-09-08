// background-fetch.d.ts
interface BackgroundFetchManager {
    fetch(
        id: string,
        requests: RequestInfo[],
        options?: BackgroundFetchOptions
    ): Promise<BackgroundFetchRegistration>;
    get(id: string): Promise<BackgroundFetchRegistration>;
}

interface BackgroundFetchUIOptions {
    title?: string;
    icons?: Array<{
        src: string;
        sizes?: string;
        type?: string;
        label?: string;
    }>;
}
interface BackgroundFetchOptions extends BackgroundFetchUIOptions {
    downloadTotal?: number;
}

interface BackgroundFetchRegistration extends EventTarget {
    id: string;
    uploadTotal: number;
    uploaded: number;
    downloadTotal: number;
    downloaded: number;
    result: 'success' | 'failure';
    failureReason: string;
    recordsAvailable: Promise<boolean>;
    match(request: RequestInfo): Promise<BackgroundFetchRecord | undefined>;
    matchAll(): Promise<BackgroundFetchRecord[]>;
    abort(): Promise<boolean>;
}

interface BackgroundFetchRecord {
    request: Request;
    responseReady: Promise<Response>;
}

interface ServiceWorkerRegistration {
    backgroundFetch: BackgroundFetchManager;
}

interface BackgroundFetchEvent extends ExtendableEvent {
    readonly registration: BackgroundFetchRegistration;
}
interface BackgroundFetchUpdateUIEvent extends BackgroundFetchEvent {
    updateUI(options?: BackgroundFetchUIOptions): Promise<undefined>;
}

interface ServiceWorkerGlobalScopeEventMap {
    backgroundfetchsuccess: BackgroundFetchUpdateUIEvent;
    backgroundfetchfail: BackgroundFetchUpdateUIEvent;
    backgroundfetchclick: BackgroundFetchEvent;
    backgroundfetchabort: BackgroundFetchEvent;
}