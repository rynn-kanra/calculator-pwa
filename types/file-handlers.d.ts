// Add File Handling API types
interface LaunchParams {
    files: FileSystemFileHandle[];
}

interface LaunchQueue {
    setConsumer(consumer: (launchParams: LaunchParams) => void): void;
}

// Extend Window to include launchQueue
interface Window {
    launchQueue?: LaunchQueue;
}

// Add to same file or service-worker.d.ts
interface LaunchParams {
    files: FileSystemFileHandle[];
}

interface LaunchQueueEvent extends ExtendableEvent {
    launchParams: LaunchParams;
}

interface ServiceWorkerGlobalScope {
    launchQueue?: LaunchQueue;
    addEventListener(
        type: 'launchqueue',
        listener: (this: ServiceWorkerGlobalScope, ev: LaunchQueueEvent) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
}