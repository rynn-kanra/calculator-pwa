import * as CBOR from "cbor-x";
import dBService, { User } from "./IndexedDBService";
import { toBase64url, compare, concat, COSEKey, coseToCryptoKey, der2Raw, toUint8Array } from "../Utility/crypto";

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

const utf8Decoder = new TextDecoder('utf-8');
const utf8Encoder = new TextEncoder();
const userId = "admin@admin";
const rpId = window.location.hostname;
const origin = window.location.origin;
const userIdentity: PublicKeyCredentialUserEntity = {
    id: utf8Encoder.encode(userId),
    name: "admin",
    displayName: "admin",
};
let challenge: Uint8Array | undefined = undefined;
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
        const decodedClientData = utf8Decoder.decode(cred.response.clientDataJSON);
        // parse the string as an object
        const clientDataObj = JSON.parse(decodedClientData) as WebAuthnClientData;
        if (clientDataObj.type != "webauthn.create") {
            throw new Error("mismatch type");
        }
        if (!clientDataObj.origin.startsWith(origin)) {
            throw new Error("mismatch origin");
        }
        if (!challenge || clientDataObj.challenge != toBase64url(challenge)) {
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

        await dBService.save("users", {
            id: userId,
            credId: authData.credId,
            publicKey: authData.publicKey
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
        const decodedClientData = utf8Decoder.decode(cred.response.clientDataJSON);
        // parse the string as an object
        const clientDataObj = JSON.parse(decodedClientData) as WebAuthnClientData;
        if (clientDataObj.type != "webauthn.get") {
            throw new Error("mismatch type");
        }
        if (!clientDataObj.origin.startsWith(origin)) {
            throw new Error("mismatch origin");
        }
        if (!challenge || clientDataObj.challenge != toBase64url(challenge)) {
            throw new Error("mismatch challenge");
        }

        if (!(cred.response instanceof AuthenticatorAssertionResponse)) {
            throw new Error("invalid response");
        }

        const authData = this.parseAuthData(cred.response.authenticatorData);
        const expectedRpIdHash = new Uint8Array(await crypto.subtle.digest("SHA-256", utf8Encoder.encode(rpId)));
        if (!compare(authData.rpIdHash, expectedRpIdHash)) {
            throw new Error("rpIdHash mismatch");
        }
        if ((authData.flags & 0x01) === 0) {
            throw new Error("User not present");
        }
        if ((authData.flags & 0x04) === 0) {
            throw new Error("User not verified");
        }

        const userId = utf8Decoder.decode(cred.response.userHandle!);
        const userData = await dBService.get("users", userId) as User;
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
}

const service = new IdentityService();
export default service;
