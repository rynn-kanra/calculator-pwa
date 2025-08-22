import { fromBase64, fromBase64url, toBase64url } from "../Utility/crypto";
import identityService from "./IdentityService";

class PushService {
    public async subscribe(): Promise<boolean> {
        try {
            const sw = await navigator.serviceWorker.getRegistration();
            if (!sw) {
                throw new Error("No service worker");
            }

            let permission = await sw.pushManager.permissionState({
                userVisibleOnly: true
            });
            if (permission === "prompt") {
                const p = await Notification.requestPermission();
                permission = p as PermissionState;
            }

            if (permission === "denied") {
                throw new Error("Permission denied");
            }

            let subscription = await sw?.pushManager.getSubscription();
            if (subscription) {
                return true;
            }

            const publicKey = await identityService.getVAPIDPublic();
            subscription = await sw?.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: fromBase64(fromBase64url(publicKey))
            });

            await identityService.subscribe(subscription.toJSON());
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
    public async unsubscribe(): Promise<boolean> {
        try {
            const sw = await navigator.serviceWorker.getRegistration();
            if (!sw) {
                throw new Error("No service worker");
            }

            let subscription = await sw?.pushManager.getSubscription();
            if (!subscription) {
                return true;
            }
            const result = await subscription.unsubscribe();
            if (result) {
                await identityService.unsubscribe(subscription.toJSON());
            }
            
            return result;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
}

const service = new PushService();
export default service;