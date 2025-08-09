declare global {
    interface WakeLock {
        request: (type: 'screen') => Promise<any>;
    }

    interface WakeLockSentinel {
        released: boolean;
        release: () => Promise<void>;
        onrelease: () => void;
    }

    interface Navigator {
        wakeLock: {
            request: (type: 'screen') => Promise<WakeLockSentinel>;
        };
    }
}

class ScreenService {
    private _wakeLock?: WakeLockSentinel;
    public async keepScreenAwake(): Promise<boolean> {
        if (this.isKeepAwake) {
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
    public get isKeepAwake() {
        return this._wakeLock?.released == false;
    }
    public async releaseWakeLock(): Promise<void> {
        if (!this._wakeLock) {
            return;
        }

        await this._wakeLock.release();
        this._wakeLock = undefined;
    }

    public static default = new ScreenService();
}

export default ScreenService.default;