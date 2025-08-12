import identityService from "./IdentityService";

class AuthenticationService {
    public async register(): Promise<boolean> {
        try {
            const option = await identityService.getRegisterOption();
            const credential = await navigator.credentials.create({
                publicKey: option
            });
            await identityService.register(credential as PublicKeyCredential);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
    public async authenticate(): Promise<boolean> {
        try {
            const option = await identityService.getAuthenticationOption();
            const assertion = await navigator.credentials.get({
                publicKey: option,
                mediation: "optional"
            });
            await identityService.authenticate(assertion as PublicKeyCredential);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
    public async isRegistered(): Promise<boolean> {
        try {
            const user = await identityService.getUser();
            return !!user?.id;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
}

const service = new AuthenticationService();
export default service;