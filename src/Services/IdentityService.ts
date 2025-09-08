import * as CBOR from "cbor-x";
import dBService, { User } from "./ServerDBService";
import { toBase64url, compare, concat, COSEKey, coseToCryptoKey, der2Raw, toUint8Array, toBase64, vapidJWT, vapidPrivate2CryptoKey, encryptWebPush, toUtf8, fromUtf8 } from "../Utility/crypto";
import { fetchCORS } from "../Utility/fetchCORS";

type AttestationObject = {
    authData: Uint8Array,
    fmt: string,
    attStmt: any
};
type WebAuthnClientData = {
    type: string,
    origin: string,
    challenge: string
};
type TPMAtestationStatement = {
    ver: string;
    alg: number;
    x5c?: Uint8Array[];
    sig: Uint8Array;
    certInfo: Uint8Array;
    pubArea: Uint8Array;
}
type PushMessage = {
    payload: string;
    ttl?: number;
    topic?: string;
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
    authMode?: "vapid" | "webpush";
}

const userId = "admin@admin";
const rpId = globalThis.location.hostname;
const origin = globalThis.location.origin;
const userIdentity: PublicKeyCredentialUserEntity = {
    id: toUtf8(userId),
    name: "admin",
    displayName: "admin",
};
let challenge: Uint8Array | undefined = undefined;

const vapid = {
    subject: "mailto:rynn-kanra@github.io",
    public: "BFqeYC55FCtAn_Ymu7R9RiC9Cwn-dcJPFpW0JLhCSbQCnd_mfhwPGs2u7hoafCABdlvvH2oP5Wi9tmF75eRUP74",
    private: "QwXVug4DMGs06_I9U-A4X_764qNHgT2s7BfuKPwXfEQ"
};
class IdentityService {
    public async getRegisterOption(): Promise<PublicKeyCredentialCreationOptions> {
        challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const option: PublicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "Printer Calculator",
                id: rpId
            },
            user: userIdentity,
            pubKeyCredParams: [
                // ES256 = ECDSA with SHA-256 (P-256 curve)
                { alg: -7, type: "public-key" },
                // RS256 = RSASSA-PKCS1-v1_5 using SHA-256
                // { alg: -257, type: "public-key" }
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                requireResidentKey: false,
                userVerification: "required"
            },
            timeout: 50000,
            attestation: "direct"
        };

        return option;
    }
    public async register(cred: PublicKeyCredential): Promise<void> {
        const decodedClientData = fromUtf8(cred.response.clientDataJSON);
        // parse the string as an object
        const clientDataObj = JSON.parse(decodedClientData) as WebAuthnClientData;
        if (clientDataObj.type != "webauthn.create") {
            throw new Error("mismatch type");
        }
        if (!clientDataObj.origin.startsWith(origin)) {
            throw new Error("mismatch origin");
        }
        if (!challenge || clientDataObj.challenge != toBase64url(toBase64(challenge))) {
            throw new Error("mismatch challenge");
        }

        if (!(cred.response instanceof AuthenticatorAttestationResponse)) {
            throw new Error("invalid response");
        }

        const attestation = CBOR.decode(new Uint8Array(cred.response.attestationObject)) as AttestationObject;
        const authData = this.parseAuthData(attestation.authData);

        if ((authData.flags & 0x40) === 0) {
            throw new Error("No attested credential data present");
        }

        await dBService.set("users", {
            id: userId,
            credId: authData.credId!,
            publicKey: authData.publicKey!
        });
    }
    public async getAuthenticationOption(): Promise<PublicKeyCredentialRequestOptions> {
        challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const userData = await dBService.get("users", userId) as User;
        return {
            challenge: challenge,
            rpId: rpId,
            allowCredentials: [{
                id: userData.credId,
                type: 'public-key',
                transports: ['usb', 'ble', 'nfc', 'internal', 'hybrid'],
            }],
            userVerification: "required", // needed for userHandle
            timeout: 50000,
        };
    }
    public async authenticate(cred: PublicKeyCredential): Promise<void> {
        const decodedClientData = fromUtf8(cred.response.clientDataJSON);
        // parse the string as an object
        const clientDataObj = JSON.parse(decodedClientData) as WebAuthnClientData;
        if (clientDataObj.type != "webauthn.get") {
            throw new Error("mismatch type");
        }
        if (!clientDataObj.origin.startsWith(origin)) {
            throw new Error("mismatch origin");
        }
        if (!challenge || clientDataObj.challenge != toBase64url(toBase64(challenge))) {
            throw new Error("mismatch challenge");
        }

        if (!(cred.response instanceof AuthenticatorAssertionResponse)) {
            throw new Error("invalid response");
        }

        const authData = this.parseAuthData(cred.response.authenticatorData);
        const expectedRpIdHash = new Uint8Array(await crypto.subtle.digest("SHA-256", toUtf8(rpId)));
        if (!compare(authData.rpIdHash, expectedRpIdHash)) {
            throw new Error("rpIdHash mismatch");
        }
        if ((authData.flags & 0x01) === 0) {
            throw new Error("User not present");
        }
        if ((authData.flags & 0x04) === 0) {
            throw new Error("User not verified");
        }

        const user = cred.response.userHandle ? fromUtf8(cred.response.userHandle) : userId;
        const userData = await dBService.get("users", user) as User;
        const clientDataHash = await crypto.subtle.digest("SHA-256", cred.response.clientDataJSON);

        // combine data
        const dataToVerify = concat(cred.response.authenticatorData, clientDataHash);

        const coseKey = CBOR.decode(userData.publicKey) as COSEKey;
        const [publicKey, algo] = await coseToCryptoKey(coseKey);
        const signature = (algo as EcdsaParams).name == "ECDSA" ? der2Raw(cred.response.signature) : new Uint8Array(cred.response.signature);
        const isSignatureValid = await crypto.subtle.verify(algo, publicKey, signature, dataToVerify);

        if (!isSignatureValid) {
            throw new Error("invalid signature");
        }
    }
    public async getUser(): Promise<User> {
        const userData = await dBService.get("users", userId) as User;
        return userData;
    }

    private parseAuthData(data: ArrayBuffer | ArrayBufferView) {
        const byteArray = toUint8Array(data);
        const view = new DataView(byteArray.buffer, byteArray.byteOffset, byteArray.byteLength);
        let offset = 0;

        const rpIdHash = byteArray.slice(offset, offset + 32);
        offset += 32;

        const flags = view.getUint8(offset);
        offset += 1;

        const signCount = view.getUint32(offset, false); // Big-endian
        offset += 4;

        // Check if attested credential data is present
        const attestedCredentialDataPresent = (flags & 0x40) !== 0;
        let aaguid: Uint8Array | undefined = undefined;
        let credId: Uint8Array | undefined = undefined;
        let publicKey: Uint8Array | undefined = undefined;
        if (attestedCredentialDataPresent) {
            aaguid = byteArray.slice(offset, offset + 16);
            offset += 16;

            const credIdLen = view.getUint16(offset, false); // Big-endian
            offset += 2;

            credId = byteArray.slice(offset, offset + credIdLen);
            offset += credIdLen;

            publicKey = byteArray.slice(offset); // Remaining buffer is CBOR public key
        }

        return {
            rpIdHash,
            flags,
            signCount,
            aaguid,
            credId,
            publicKey
        };
    }

    // PUSH API
    public async getVAPIDPublic() {
        return vapid.public;
    }
    public async subscribe(subscription: PushSubscriptionJSON) {
        await dBService.set("subscriptions", JSON.parse(JSON.stringify(subscription)));
    }
    public async unsubscribe(subscription: PushSubscriptionJSON) {
        await dBService.delete("subscriptions", subscription.endpoint!);
    }
    public async pushMessage(message?: PushMessage) {
        const subscriptions = await dBService.getAll("subscriptions");
        const [privateKey, algo] = await vapidPrivate2CryptoKey(vapid.private, vapid.public);
        const sends: Promise<Response>[] = [];
        for (const subscription of subscriptions) {
            if (!subscription.endpoint) {
                continue;
            }

            sends.push((async () => {
                const jwt = await vapidJWT(subscription.endpoint!, vapid.subject, privateKey, algo);
                const { body, salt, serverPublicKeyB64u } = await encryptWebPush(subscription.keys!.p256dh, subscription.keys!.auth, message?.payload);

                const headers: Record<string, string> = {
                    'Crypto-Key': `dh=${serverPublicKeyB64u}`,
                    'TTL': (Math.min(message?.ttl || 24 * 60 * 60, 24 * 60 * 60)).toString(),
                    'Content-Length': body.byteLength.toString(),
                };
                if (message?.urgency) {
                    headers['Urgency'] = message.urgency;
                }
                if (message?.topic) {
                    headers['Urgency'] = message.topic;
                }
                switch (message?.authMode) {
                    case "vapid": {
                        headers['Authorization'] = `vapid t=${jwt},k=${vapid.public}`;
                        break;
                    }
                    default:
                    case "webpush": {
                        headers['Authorization'] = `WebPush ${jwt}`;
                        headers['Crypto-Key'] = `${headers['Crypto-Key']};p256ecdsa=${vapid.public}`;
                        break;
                    }
                }

                if (body.byteLength > 0) {
                    headers['Encryption'] = `salt=${salt}`;
                    headers['Content-Encoding'] = 'aesgcm';
                    headers['Content-Type'] = 'application/octet-stream';
                }

                return await fetchCORS(subscription.endpoint!, { method: 'POST', headers, body });
            })());
        }

        return await Promise.all(sends);
    }
}

const service = new IdentityService();
export default service;
