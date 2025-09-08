export type COSEKey = {
  1: number; // KTY
  3: number; // alg
  "-1": number | ArrayBuffer; // curve
  "-2": ArrayBuffer; // x
  "-3": ArrayBuffer; // y
}
export enum COSE_KTY {
  OKP = 1,
  EC2 = 2,
  RSA = 3
}
const CURVE_MAP: { [key: number]: string } = {
  // EC2
  1: "P-256",
  2: "P-384",
  3: "P-521",

  // OKP
  6: "Ed25519",
  7: "Ed448"
};
const HASH_MAP: { [key: number]: string } = {
  // EC2
  "-7": "SHA-256",   // ES256
  "-35": "SHA-384",  // ES384
  "-36": "SHA-512",   // ES512

  // RSA
  "-257": "SHA-256",  // RS256
  "-258": "SHA-384",  // RS384
  "-259": "SHA-512"   // RS512
};

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8');

export function fromUtf8(data: ArrayBuffer | ArrayBufferView) {
  const uint8 = toUint8Array(data);
  return utf8Decoder.decode(uint8);
}
export function toUtf8(str: string) {
  return utf8Encoder.encode(str);
}

export async function coseToCryptoKey(coseKey: COSEKey): Promise<[CryptoKey, AlgorithmIdentifier | RsaPssParams | EcdsaParams]> {
  const kty = coseKey[1];
  const alg = coseKey[3];

  switch (kty) {
    case COSE_KTY.EC2: {
      const namedCurve = CURVE_MAP[coseKey["-1"] as number];
      const hash = HASH_MAP[alg];

      if (!namedCurve || !hash) throw new Error("Unsupported EC curve or algorithm");

      const jwk = {
        kty: "EC",
        crv: namedCurve,
        x: toBase64url(toBase64(coseKey[-2])),
        y: toBase64url(toBase64(coseKey[-3])),
        ext: true,
        key_ops: ["verify"]
      };

      const key = await crypto.subtle.importKey("jwk", jwk,
        { name: "ECDSA", namedCurve },
        true, ["verify"]
      );
      const algo = { name: "ECDSA", hash: { name: hash } };
      return [key, algo];
    }
    case COSE_KTY.RSA: {
      const hash = HASH_MAP[alg];
      if (!hash) throw new Error("Unsupported RSA algorithm");

      const jwk = {
        kty: "RSA",
        n: toBase64url(toBase64(coseKey[-1] as ArrayBuffer)), // modulus
        e: toBase64url(toBase64(coseKey[-2])), // exponent
        alg: `RS${hash.split("-")[1]}`, // e.g., "RS256"
        ext: true,
        key_ops: ["verify"]
      };

      const algo = { name: "RSASSA-PKCS1-v1_5", hash: { name: hash } };
      const key = await crypto.subtle.importKey("jwk", jwk,
        algo, true, ["verify"]
      );

      return [key, algo];
    }
    case COSE_KTY.OKP: {
      const name = CURVE_MAP[coseKey[-1] as number];
      const x = coseKey[-2]; // public key bytes

      if (!name) throw new Error("Unsupported OKP curve");

      const algo = { name };
      const key = await crypto.subtle.importKey("raw", new Uint8Array(x),
        algo,
        true, ["verify"]
      );
      return [key, algo];
    }
  }

  throw new Error(`Unsupported key type (kty: ${kty})`);
}

function encodeInteger(bytes: Uint8Array): Uint8Array {
  let i = 0;
  while (i < bytes.length && bytes[i] === 0) {
    i++;
  }

  let val = bytes.slice(i);
  if (val.length === 0) {
    val = new Uint8Array([0x00]); // Integer value 0
  }

  if (val[0] & 0x80) {
    const padded = new Uint8Array(val.length + 1);
    padded[0] = 0x00;
    padded.set(val, 1);
    val = padded;
    val = new Uint8Array([0, ...val]); // prepend 0 to prevent negative
  }

  if (val.length > 33) {
    throw new Error("ASN.1 INTEGER too long (max 33 bytes)");
  }

  const out = new Uint8Array(2 + val.length);
  out[0] = 0x02; // INTEGER
  out[1] = val.length;
  out.set(val, 2);
  return out;
}

export function toBase64url(base64: string) {
  return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
export function fromBase64url(base64Url: string) {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  return (base64Url + padding).replaceAll("-", "+").replaceAll("_", "/");
}
export function toUint8Array(buffer: ArrayBuffer | ArrayBufferView | ArrayLike<number>) {
  if (buffer instanceof Uint8Array) {
    return buffer;
  }
  if (ArrayBuffer.isView(buffer)) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  return new Uint8Array(buffer);
}
export function der2Raw(der: ArrayBuffer | ArrayBufferView, size = 32): Uint8Array {
  const derView = toUint8Array(der);
  let offset = 0;

  if (derView[offset++] !== 0x30) throw new Error("Invalid DER format");
  let length = derView[offset++];
  if (length & 0x80) {
    const numOfBytes = length & 0x7f;
    length = 0;
    for (let i = 0; i < numOfBytes; i++) {
      length = (length << 8) | derView[offset++];
    }
  }

  const sequenceEnd = offset + length;
  if (sequenceEnd !== derView.length) {
    throw new Error(`Invalid DER: declared length (${length}) doesn't match actual length (${derView.length - offset})`);
  }

  if (derView[offset++] !== 0x02) {
    throw new Error("Invalid R marker");
  }

  const rLen = derView[offset++];
  const r = derView.slice(offset + (rLen < size ? 0 : rLen - size), offset + rLen);
  offset += rLen;

  if (derView[offset++] !== 0x02) {
    throw new Error("Invalid S marker");
  }
  const sLen = derView[offset++];
  const s = derView.slice(offset + (sLen < size ? 0 : sLen - size), offset + sLen);
  offset += sLen;

  // Final offset check to ensure no trailing data
  if (offset !== derView.length) {
    throw new Error("Invalid DER: extra bytes after s-value");
  }

  const rPadded = new Uint8Array(size);
  const sPadded = new Uint8Array(size);

  rPadded.set(r, size - r.length);
  sPadded.set(s, size - s.length);

  return new Uint8Array([...rPadded, ...sPadded]);
}
export function raw2Der(raw: ArrayBuffer | ArrayBufferView): Uint8Array {
  const rawView = toUint8Array(raw);
  if (rawView.length % 2 !== 0) {
    throw new Error("Invalid raw signature: length must be even (r || s)");
  }

  const size = rawView.length / 2;
  const r = rawView.slice(0, size);
  const s = rawView.slice(size);

  const rDer = encodeInteger(r);
  const sDer = encodeInteger(s);

  const sequenceLen = rDer.length + sDer.length;
  const der = new Uint8Array(2 + sequenceLen);
  let offset = 0;

  der[offset++] = 0x30; // SEQUENCE
  der[offset++] = sequenceLen;
  der.set(rDer, offset);
  offset += rDer.length;
  der.set(sDer, offset);

  return der;
}
export function compare(buf1: ArrayBuffer | ArrayBufferView, buf2: ArrayBuffer | ArrayBufferView) {
  if (buf1.byteLength !== buf2.byteLength) return false;

  const view1 = buf1 instanceof ArrayBuffer ? new Uint8Array(buf1) : new Uint8Array(buf1.buffer, buf1.byteOffset, buf1.byteLength);
  const view2 = buf2 instanceof ArrayBuffer ? new Uint8Array(buf2) : new Uint8Array(buf2.buffer, buf2.byteOffset, buf2.byteLength);

  for (let i = 0; i < view1.length; i++) {
    if (view1[i] !== view2[i]) {
      return false;
    }
  }

  return true;
}
export function concat(...buffers: (ArrayBuffer | ArrayBufferView | ArrayLike<number>)[]) {
  const views = buffers.map(o => o instanceof ArrayBuffer || ArrayBuffer.isView(o) ? toUint8Array(o) : o);
  const result = new Uint8Array(views.map(o => o.length).reduce((a, b) => a + b, 0));
  let offset = 0;
  for (const view of views) {
    result.set(view, offset);
    offset += view.length;
  }

  return result;
}
export function fromBase64(base64: string) {
  // Decode base64 to binary string
  const binaryString = atob(base64);

  // Create a Uint8Array from the binary string
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}
export function toBase64(buffer: ArrayBuffer | ArrayBufferView) {
  const view = toUint8Array(buffer);
  let binary = '';
  for (let i = 0; i < view.length; i++) {
    binary += String.fromCharCode(view[i]);
  }
  return btoa(binary);
}

export function raw2JWK(publicKey: ArrayBuffer | ArrayBufferView, privateB64u?: string): JsonWebKey {
  const pubBytes = toUint8Array(publicKey);
  if (pubBytes[0] !== 0x04) {
    throw new Error('publicKey must be raw/uncompressed');
  }

  return {
    kty: "EC", crv: "P-256",
    x: toBase64url(toBase64(pubBytes.slice(1, 33))),
    y: toBase64url(toBase64(pubBytes.slice(33, 65))),
    d: privateB64u,
    ext: true
  };
}
export async function vapidPrivate2CryptoKey(privateB64u: string, publicB64u: string): Promise<[CryptoKey, AlgorithmIdentifier | RsaPssParams | EcdsaParams]> {
  const pubBytes = fromBase64(fromBase64url(publicB64u)); // 65 bytes
  const key = await crypto.subtle.importKey("jwk", raw2JWK(pubBytes, privateB64u)
    , { name: "ECDSA", namedCurve: "P-256" }
    , true, ["sign"]
  );
  const algo = { name: "ECDSA", hash: { name: "SHA-256" } };
  return [key, algo];
}
export async function vapidJWT(endpoint: string, vapidSubject: string, vapidPrivKey: CryptoKey, algo: AlgorithmIdentifier | RsaPssParams | EcdsaParams) {
  const aud = new URL(endpoint).origin;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 12 * 60 * 60; // 12h
  const header = { typ: 'JWT', alg: 'ES256' }; // kid
  const payload = { iat, aud, exp, sub: vapidSubject };

  const hB64 = toBase64url(toBase64(toUtf8(JSON.stringify(header))));
  const pB64 = toBase64url(toBase64(toUtf8(JSON.stringify(payload))));
  const signingInput = `${hB64}.${pB64}`;

  const signRaw = await crypto.subtle.sign(algo, vapidPrivKey, toUtf8(signingInput));
  const sigB64 = toBase64url(toBase64(signRaw));
  return `${signingInput}.${sigB64}`;
}

// Helper to HKDF-Expand (derive bits then slice length)
async function hkdfExpand(hkdfKey: CryptoKey, info: Uint8Array, salt: Uint8Array, length: number) {
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt, info },
    hkdfKey, length * 8
  );
  return new Uint8Array(bits);
}

/** ---------- Web Push payload encryption (aes128gcm) ---------- */
// RFC 8291/8188 method for Web Push:
//   salt: 16 bytes random
//   server generates ephemeral ECDH key pair (P-256)
//   sharedSecret = ECDH(serverPriv, clientP256DH)
//   PRK = HKDF-Extract(authSecret, sharedSecret)
//   CEK  = HKDF(PRK, info="Content-Encoding: aes128gcm\0P-256\0clientPubKey\0serverPubKey", len=16)
//   NONCE= HKDF(PRK, info="Content-Encoding: nonce\0P-256\0clientPubKey\0serverPubKey", len=12)
//   Record = 0x00 || plaintext
//   Cipher = AES-128-GCM(key=CEK, iv=NONCE, AAD=""), tag appended
export async function encryptWebPush(clientP256dhB64u: string, clientAuthB64u: string, message?: string) {
  // 1) Generate server ephemeral ECDH key pair
  const serverEphemeral = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const serverPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverEphemeral.publicKey));
  const serverPubB64u = toBase64url(toBase64(serverPubRaw));

  if (!message) {
    return {
      body: new Uint8Array(0),
      salt: new Uint8Array(0),
      serverPublicKeyB64u: serverPubB64u
    }
  }

  // 2) Import client public key
  const clientPubRaw = fromBase64(fromBase64url(clientP256dhB64u)); // uncompressed EC point (65 bytes)
  const clientPubKey = await crypto.subtle.importKey('jwk', raw2JWK(clientPubRaw), { name: 'ECDH', namedCurve: 'P-256' }, true, []);

  // 3) ECDH to get shared secret (IKM)
  const ikmBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPubKey }, serverEphemeral.privateKey, 256
  );
  const ikm = await crypto.subtle.importKey('raw', ikmBits, { name: 'HKDF' }, false, ['deriveBits', 'deriveKey']);

  // 4) HKDF-Extract using authSecret as salt to get PRK
  // WebCrypto HKDF uses ikm as key; salt & info passed in deriveBits.
  const authSecret = fromBase64(fromBase64url(clientAuthB64u));     // 16 bytes
  const prkBits = await hkdfExpand(ikm, toUtf8("Content-Encoding: auth\0"), authSecret, 32);
  const prk = await crypto.subtle.importKey('raw', prkBits, { name: 'HKDF' }, false, ['deriveBits']);

  // 5) Derive CEK (16 bytes) and NONCE (12 bytes)
  // Build "context": "P-256\0" + len(pubClient)=0x00 0x41 + clientPub + len(pubServer)=0x00 0x41 + serverPub
  const context = concat(toUtf8('P-256\0'),
    new Uint8Array([(clientPubRaw.byteLength >> 8) & 0xff, clientPubRaw.byteLength & 0xff]),
    clientPubRaw,
    new Uint8Array([(serverPubRaw.byteLength >> 8) & 0xff, serverPubRaw.byteLength & 0xff]),
    serverPubRaw
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const infoCEK = concat(toUtf8('Content-Encoding: aesgcm\0'), context);
  const cek = await hkdfExpand(prk, infoCEK, salt, 16);

  const infoNONCE = concat(toUtf8('Content-Encoding: nonce\0'), context);
  const nonce = await hkdfExpand(prk, infoNONCE, salt, 12);

  // 6) Build record: 2 byte padLength + 0x00 pad delimiter + plaintext
  const plaintextUint8 = toUtf8(message);
  const padSize = 0;
  const pad = new Uint8Array(padSize);
  const record = concat(new Uint8Array([(padSize >> 8) & 0xff, padSize & 0xff]), pad, plaintextUint8);

  // 7) Encrypt body with AES-128-GCM
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const encryptedBody = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, record));

  return {
    body: encryptedBody, // request body
    salt: toBase64url(toBase64(salt)),  // for 'Encryption' header
    serverPublicKeyB64u: serverPubB64u  // for 'Crypto-Key' header (dh=)
  };
}