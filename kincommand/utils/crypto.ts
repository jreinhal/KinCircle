/**
 * Secure cryptographic utilities for PIN/password hashing
 * Uses Web Crypto API with PBKDF2 for secure key derivation
 */

const ITERATIONS = 100000;
const HASH_LENGTH = 256;
const SALT_LENGTH = 16; // 128 bits for salt

/**
 * Generates a cryptographically secure random salt
 * @returns Base64-encoded salt string
 */
function generateSalt(): string {
  const saltArray = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(saltArray);
  return Array.from(saltArray, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a secure hash of a PIN using PBKDF2 with a unique salt
 * The returned string includes the salt for verification
 * Format: salt$hash
 * @param pin - The PIN to hash
 * @returns Combined salt and hash string
 */
export async function hashPinSecure(pin: string): Promise<string> {
  const salt = generateSalt();
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);
  const saltBuffer = encoder.encode(salt);

  // Import the PIN as a key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH
  );

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Return salt$hash format for storage
  return `${salt}$${hashHex}`;
}

/**
 * Verifies a PIN against a stored hash (with embedded salt)
 * @param pin - The PIN to verify
 * @param storedHash - The stored salt$hash string to compare against
 * @returns True if PIN matches
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  // Handle legacy format (no salt separator) for backwards compatibility
  if (!storedHash.includes('$')) {
    // Legacy hash - use old static salt for backwards compatibility
    const legacySalt = 'kincircle-pin-salt-v1';
    const computedHash = await hashWithSalt(pin, legacySalt);
    return constantTimeCompare(computedHash, storedHash);
  }

  // New format: salt$hash
  const [salt, expectedHash] = storedHash.split('$');
  if (!salt || !expectedHash) return false;

  const computedHash = await hashWithSalt(pin, salt);
  return constantTimeCompare(computedHash, expectedHash);
}

/**
 * Internal function to hash with a specific salt
 */
async function hashWithSalt(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);
  const saltBuffer = encoder.encode(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Legacy hash function for backwards compatibility during migration
 * @deprecated Use hashPinSecure instead
 */
export function hashPinLegacy(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Generates a cryptographically secure random string
 * @param length - Length of the string to generate
 * @returns Random hex string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
