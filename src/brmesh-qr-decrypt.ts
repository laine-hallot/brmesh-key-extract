const B64_KEY = "lol"; // same constants the Android app uses
const B64_IV = "lmao";

/**
 * Convert a Base‑64 string to a Uint8Array.
 */
function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  // `atob` works on browsers – it returns a binary string.
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; ++i) out[i] = binary.charCodeAt(i);
  return out;
}

/**
 * Convert an Uint8Array (or ArrayBuffer) to a UTF‑8 string.
 */
function bytesToString(buf: ArrayBuffer | Uint8Array): string {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(buf);
}

/**
 * Main decryption routine.
 *
 * @param b64Payload – QR payload as a Base‑64 string.
 * @returns A promise that resolves to `[meshKey, devices]`.
 */
export async function decryptBrmeshQR(
  b64Payload: string
): Promise<{ meshKey: number; devices: BaseDevice[] }> {
  // -----------------------------------------------------------------
  // 1️⃣  Prepare key, IV and import the key for WebCrypto
  // -----------------------------------------------------------------
  const keyBytes = b64ToBytes(B64_KEY);
  const ivBytes = b64ToBytes(B64_IV);
  const algorithm = (() => {
    switch (keyBytes.length) {
      case 16:
        return "AES-CBC"; // AES‑128‑CBC
      case 24:
        return "AES-CBC"; // AES‑192‑CBC (supported by browsers)
      case 32:
        return "AES-CBC"; // AES‑256‑CBC
      default:
        throw new Error(`Unsupported AES key length ${keyBytes.length} bytes`);
    }
  })();

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: algorithm },
    false, // not extractable – we never need to export it again
    ["decrypt"]
  );

  // -----------------------------------------------------------------
  // 2️⃣  Decrypt the payload (still padded)
  // -----------------------------------------------------------------
  const encrypted = b64ToBytes(b64Payload);
  const rawDecrypted = await crypto.subtle.decrypt(
    { name: algorithm, iv: ivBytes },
    cryptoKey,
    encrypted
  );

  // -----------------------------------------------------------------
  // 3️⃣  Strip PKCS#7 padding (mirrors the Python code)
  // -----------------------------------------------------------------
  const padded = new Uint8Array(rawDecrypted);
  //const plaintextBytes = stripPKCS7(padded);
  const plaintext = bytesToString(padded);

  // -----------------------------------------------------------------
  // 4️⃣  Split into JSON part and mesh key
  // -----------------------------------------------------------------
  // Expected format:  <json>];<meshKey>
  const regexResult = plaintext.matchAll(/(?<json>.*?\]);(?<meshKey>.*)/g);
  const textMatch = regexResult.next().value;

  const json = textMatch?.groups?.json;
  const meshKey = textMatch?.groups?.meshKey;

  if (json === undefined || meshKey === undefined) {
    throw new Error("Unexpected payload format - missing `];` separator");
  }

  console.log(plaintext);

  // The JSON that the Android app builds ends with a stray `]` that we removed
  // when we split on `];`.  Add it back before parsing.
  const rawDeviceData: string[] = JSON.parse(json!);
  const devices = parseDeviceEntries(rawDeviceData);
  if (devices.ok) {
    return { meshKey: Number(meshKey), devices: devices.data };
  }
  return { meshKey: Number(meshKey), devices: [] };
}

export type BaseDevice = {
  a: number;
  d: string;
  n: string;
  t: number;
  v: string;
};
const parseDeviceEntries = (
  rawDeviceData: string[]
): { ok: true; data: BaseDevice[] } | { ok: false } => {
  const devices = rawDeviceData
    .map<BaseDevice | undefined>((rawData) => {
      const data = JSON.parse(rawData);
      if (validateDeviceData(data)) {
        return data;
      }
    })
    .filter((value) => value !== undefined);
  if (devices.length > 0) {
    return { ok: true, data: devices };
  }
  return { ok: false };
};
const validateDeviceData = (device: unknown): device is BaseDevice => {
  if (typeof device === "object" && device !== null) {
    const test = device as Record<string, unknown>;
    if (
      hasKeyOfType(test, "a", "number") &&
      hasKeyOfType(test, "d", "string") &&
      hasKeyOfType(test, "n", "string") &&
      hasKeyOfType(test, "t", "number") &&
      hasKeyOfType(test, "v", "string")
    ) {
      return true;
    }
  }
  return false;
};

type PossibleTypes = {
  bigint: bigint;
  boolean: boolean;
  function: Function;
  number: number;
  object: object;
  string: string;
  symbol: symbol;
  undefined: undefined;
};

const hasKeyOfType = <
  T extends Record<string, unknown>,
  A extends keyof PossibleTypes,
  B extends string
>(
  data: T,
  key: B,
  asdf: A
): data is T & Record<B, PossibleTypes[A]> => {
  return key in data && typeof data[key] === asdf;
};
