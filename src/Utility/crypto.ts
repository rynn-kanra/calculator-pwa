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

// Map COSE algorithm ID → WebCrypto import parameters
const ALGO_MAP: Record<number, { name: string; hash?: string; namedCurve?: string }> = {
  // ECDSA
  [-7]: { name: "ECDSA", namedCurve: "P-256" },
  [-35]: { name: "ECDSA", namedCurve: "P-384" },
  [-36]: { name: "ECDSA", namedCurve: "P-521" },

  // RSA
  [-37]: { name: "RSA-PSS", hash: "SHA-256" },
  [-38]: { name: "RSA-PSS", hash: "SHA-384" },
  [-39]: { name: "RSA-PSS", hash: "SHA-512" },
  [-257]: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
  [-258]: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" },
  [-259]: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
  [-65535]: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-1" }, // RS1
};

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
        x: base64url(coseKey[-2]),
        y: base64url(coseKey[-3]),
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
        n: base64url(coseKey[-1] as ArrayBuffer), // modulus
        e: base64url(coseKey[-2]), // exponent
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
export async function x509ToCryptoKey(der: ArrayBuffer | ArrayBufferView, coseAlgo: number): Promise<[CryptoKey, AlgorithmIdentifier | RsaPssParams | EcdsaParams]> {
  const bytes = toUint8Array(der);

  // Try to find start of SubjectPublicKeyInfo (SPKI)
  let spkiOffset = 0;
  for (let i = 0; i < bytes.length - 1; i++) {
    // Very basic scan for 0x30 0x82 (SEQUENCE with 2-byte length)
    if (
      bytes[i] === 0x30 &&
      bytes[i + 1] === 0x82 &&
      i + 4 < bytes.length
    ) {
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      if (i + 4 + len === bytes.length) {
        spkiOffset = i;
        break;
      }
    }
  }

  const spkiBytes = bytes.slice(spkiOffset);

  const algo = ALGO_MAP[coseAlgo];
  if (!algo) throw new Error(`Unsupported COSE algorithm ID: ${coseAlgo}`);

  // Import the key
  const key = await crypto.subtle.importKey(
    "spki",
    spkiBytes.buffer,
    algo,
    true,
    ["verify"]
  );

  const algoName = { name: algo.name, hash: { name: algo.hash || algo.namedCurve } };
  return [key, algoName];
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

export function base64url(buffer: ArrayBuffer | ArrayBufferView) {
  const view = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return btoa(String.fromCharCode(...view))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export function base64ToBuffer(base64: string) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
export function toUint8Array(buffer: ArrayBuffer | ArrayBufferView) {
  if (buffer instanceof ArrayBuffer) {
    return new Uint8Array(buffer);
  }
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
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

export function concat(...buffers: (ArrayBuffer | ArrayBufferView)[]) {
  const views = buffers.map(o => o instanceof ArrayBuffer ? new Uint8Array(o) : new Uint8Array(o.buffer, o.byteOffset, o.byteLength));
  const result = new Uint8Array(views.map(o => o.length).reduce((a, b) => a + b, 0));

  let offset = 0;
  for (const view of views) {
    result.set(view, offset);
    offset += view.length;
  }

  return result;
}

export function coseEcKeyToPem(coseKey: any): string {
  // COSE key params (RFC 8152)
  const y = coseKey[-3]; // y coordinate
  const x = coseKey[-2]; // x coordinate (Buffer or Uint8Array)
  const crv = coseKey[-1]; // should be 1 for P-256
  const kty = coseKey[1];  // should be 2 for EC2
  const alg = coseKey[3];  // typically -7 for ES256

  if (kty !== 2 || crv !== 1) {
    throw new Error("Only EC2 keys with P-256 curve are supported");
  }

  // Build uncompressed public key (0x04 || X || Y)
  const publicKeyBytes = new Uint8Array(1 + x.length + y.length);
  publicKeyBytes[0] = 0x04;
  publicKeyBytes.set(x, 1);
  publicKeyBytes.set(y, 1 + x.length);

  // ASN.1 DER prefix for EC public key (P-256)
  const asn1Prefix = Uint8Array.from([
    0x30, 0x59,                                     // SEQUENCE (len=89)
    0x30, 0x13,                                   // SEQUENCE (len=19)
    0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01, // OID: ecPublicKey
    0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07, // OID: P-256
    0x03, 0x42, 0x00 // BIT STRING (len=66, unused bits=0)
  ]);

  // Combine prefix + public key
  const der = new Uint8Array(asn1Prefix.length + publicKeyBytes.length);
  der.set(asn1Prefix, 0);
  der.set(publicKeyBytes, asn1Prefix.length);

  // Convert to base64
  const base64 = btoa(String.fromCharCode(...der));

  // Wrap in PEM format
  const pem = `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
  return pem;
}
export async function pemToCryptoKey(pem: string): Promise<CryptoKey> {
  // Remove PEM header/footer
  const b64 = pem.replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return await crypto.subtle.importKey("spki", binaryDer.buffer,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    }, true, ["verify"]
  );
}