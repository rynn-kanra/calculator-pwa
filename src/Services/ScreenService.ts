import { listen, EventSubscription } from "../Utility/eventHandler";

class ScreenService {
    private _wakeLock?: WakeLockSentinel;
    private _idleListener?: { [key: number]: EventSubscription<IdleDetector, Event> | undefined };
    public async wakeLock(): Promise<boolean> {
        if (this.isWakeLocked) {
            return true;
        }
        try {
            this._wakeLock = await navigator.wakeLock.request('screen');
            document.addEventListener('visibilitychange', async () => {
                if (this._wakeLock !== null && document.visibilityState === 'visible') {
                    this._wakeLock = await navigator.wakeLock.request('screen');
                }
            });
            return true;
        } catch (e) {
            return false;
        }
    }
    public get isWakeLocked() {
        return this._wakeLock?.released == false;
    }
    public async releaseWakeLock(): Promise<void> {
        if (!this._wakeLock) {
            return;
        }

        await this._wakeLock.release();
        this._wakeLock = undefined;
    }
    public orientiation() {
        return screen?.orientation?.type;
    }
    public async orientiationLock(orientation: OrientationType) {
        try {
            await screen.orientation.lock(orientation);
            return true;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }
    public orientiationUnlock() {
        try {
            screen.orientation.unlock();
        }
        catch (e) {
            console.warn(e);
        }
    }
    public async fullscreen(el?: HTMLElement) {
        if (!document?.fullscreenEnabled) {
            return false;
        }

        try {
            if (!el) {
                el = document.body;
            }
            await el.requestFullscreen();
            return true;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }
    public async fullscreenExit() {
        if (!document?.fullscreenEnabled || !document?.fullscreenElement) {
            return true;
        }

        try {
            await document.exitFullscreen();
            return true;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }
    // NOTE: require IdleDetector.requestPermission() in touch event.
    public async idleEvent(threshold: number = 60_000) {
        if (!this._idleListener) {
            this._idleListener = {};
        }
        let listener = this._idleListener[threshold];
        if (!listener) {
            const permission = await navigator.permissions.query({ name: "idle-detection" as PermissionName });
            if (permission.state !== "granted") {
                throw new Error("permission denied");
            }

            const detector = new IdleDetector();
            const controller = new AbortController();
            await detector.start({
                threshold: threshold,
                signal: controller.signal
            });
            listener = listen(detector, "change");
            this._idleListener[threshold] = listener;
            const stop = listener.stop;
            listener.stop = () => {
                controller.abort();
                stop.call(listener);
                this._idleListener![threshold] = undefined;
            };
        }

        return listener;
    }
}

const instance = new ScreenService();
export default instance;