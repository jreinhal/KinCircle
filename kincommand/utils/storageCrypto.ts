/**
 * Storage encryption helpers (AES-GCM + PBKDF2).
 * Encrypts JSON payloads before persisting to localStorage.
 */

const PBKDF2_ITERATIONS = 120000;
const KEY_LENGTH_BITS = 256;
const IV_LENGTH = 12; // AES-GCM recommended length

interface EncryptedPayload {
  v: 1;
  iv: string;
  data: string;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (buffer: ArrayBuffer): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const fromBase64 = (base64: string): ArrayBuffer => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').buffer;
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const generateSaltHex = (): string => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt, b => b.toString(16).padStart(2, '0')).join('');
};

export const deriveKeyFromPin = async (pin: string, saltHex: string): Promise<CryptoKey> => {
  const saltBytes = Uint8Array.from(saltHex.match(/.{1,2}/g) || [], byte => parseInt(byte, 16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptJson = async <T>(value: T, key: CryptoKey): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = textEncoder.encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  const payload: EncryptedPayload = {
    v: 1,
    iv: toBase64(iv.buffer),
    data: toBase64(ciphertext)
  };

  return JSON.stringify(payload);
};

export const decryptJson = async <T>(payload: string, key: CryptoKey): Promise<T> => {
  const parsed = JSON.parse(payload) as EncryptedPayload;
  if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.data) {
    throw new Error('Invalid encrypted payload');
  }

  const iv = new Uint8Array(fromBase64(parsed.iv));
  const ciphertext = fromBase64(parsed.data);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(textDecoder.decode(plaintext)) as T;
};

export const isEncryptedPayload = (payload: string): boolean => {
  try {
    const parsed = JSON.parse(payload) as EncryptedPayload;
    return parsed?.v === 1 && typeof parsed.iv === 'string' && typeof parsed.data === 'string';
  } catch {
    return false;
  }
};
