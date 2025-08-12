import * as CBOR from "cbor-x";
import dBService, { User } from "./IndexedDBService";
import { base64url, compare, concat, COSEKey, coseToCryptoKey, der2Raw, toUint8Array, uint8Array2Base64, x509ToCryptoKey } from "../Utility/crypto";

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
        if (!challenge || clientDataObj.challenge != uint8Array2Base64(challenge)) {
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

        // TODO: attestation verification.
        // switch (attestation.fmt) {
        //     case "none": {
        //         break;
        //     }
        //     case "packed": {
        //         const clientDataHash = await crypto.subtle.digest("SHA-256", cred.response.clientDataJSON);

        //         // combine data
        //         const dataToVerify = concat(attestation.authData, clientDataHash);

        //         const coseKey = CBOR.decode(authData.publicKey!) as COSEKey;
        //         const [publicKey, algo] = await coseToCryptoKey(coseKey);
        //         const signature = (algo as EcdsaParams).name == "ECDSA" ? der2Raw(attestation.attStmt.sig) : new Uint8Array(attestation.attStmt.sig);
        //         const isSignatureValid = await crypto.subtle.verify(algo, publicKey, signature, dataToVerify);

        //         if (!isSignatureValid) {
        //             throw new Error("invalid signature");
        //         }
        //         break;
        //     }
        //     case "fido-u2f": {
        //         const clientDataHash = await crypto.subtle.digest("SHA-256", cred.response.clientDataJSON);

        //         const u2fData = concat(new Uint8Array([0x00]), authData.rpIdHash, clientDataHash, authData.credId!, authData.publicKey!);

        //         // DER certificate (ArrayBuffer)
        //         const certDer = attestation.attStmt.x5c?.[0] as ArrayBuffer;
        //         const cert = await crypto.subtle.importKey("spki", certDer,
        //             { name: "ECDSA", namedCurve: "P-256" }
        //             , false, ["verify"]
        //         );

        //         const signature = der2Raw(attestation.attStmt.sig as ArrayBuffer);
        //         const isSignatureValid = await crypto.subtle.verify({ name: "ECDSA", hash: { name: "SHA-256" } }
        //             , cert, signature, u2fData);

        //         if (!isSignatureValid) {
        //             throw new Error("invalid signature");
        //         }
        //     }
        //     case "tpm": {
        //         const stmt = attestation.attStmt as TPMAtestationStatement;
        //         if (stmt.ver !== '2.0') {
        //             throw new Error(`Unsupported TPM version: ${stmt.ver}`);
        //         }

        //         if (!compare(stmt.pubArea, authData.publicKey!)) {
        //             throw new Error(`invalid public keys`);
        //         }

        //         const [publicKey, algo] = await x509ToCryptoKey(stmt.x5c![0], stmt.alg);
        //         const clientDataHash = await crypto.subtle.digest("SHA-256", cred.response.clientDataJSON);
        //         const dataToVerify = concat(attestation.authData, clientDataHash);
        //         const signature = (algo as EcdsaParams).name == "ECDSA" ? der2Raw(stmt.sig) : new Uint8Array(stmt.sig);
        //         const isSignatureValid = await crypto.subtle.verify(algo, publicKey, signature, dataToVerify);
                
        //         if (!isSignatureValid) {
        //             throw new Error("invalid signature");
        //         }
        //         break;
        //     }
        //     case "apple": {
        //         break;
        //     }
        //     case "android-key": {
        //         break;
        //     }
        // }

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
        if (!challenge || clientDataObj.challenge != base64url(challenge)) {
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
