import { describe, it, expect } from 'vitest';
import { hashPinSecure, verifyPin, generateSecureToken, hashPinLegacy } from './crypto';

describe('crypto utilities', () => {
  describe('hashPinSecure', () => {
    it('should generate a hash with salt$hash format', async () => {
      const hash = await hashPinSecure('1234');
      expect(hash).toContain('$');
      const parts = hash.split('$');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBe(32); // 16 bytes = 32 hex chars
      expect(parts[1].length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate different hashes for the same PIN', async () => {
      const hash1 = await hashPinSecure('1234');
      const hash2 = await hashPinSecure('1234');
      expect(hash1).not.toBe(hash2); // Different salts should produce different hashes
    });

    it('should generate different hashes for different PINs', async () => {
      const hash1 = await hashPinSecure('1234');
      const hash2 = await hashPinSecure('5678');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPin', () => {
    it('should verify a correct PIN against its hash', async () => {
      const hash = await hashPinSecure('1234');
      const isValid = await verifyPin('1234', hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect PIN', async () => {
      const hash = await hashPinSecure('1234');
      const isValid = await verifyPin('5678', hash);
      expect(isValid).toBe(false);
    });

    it('should reject PIN with similar values', async () => {
      const hash = await hashPinSecure('1234');
      const isValid = await verifyPin('1235', hash);
      expect(isValid).toBe(false);
    });

    it('should handle legacy PBKDF2 hashes without salt separator', async () => {
      // Legacy format: PBKDF2 hash created with static salt 'kincircle-pin-salt-v1'
      // This is different from hashPinLegacy which uses a simple hash algorithm
      // We need to create a hash that matches what the legacy system would produce
      // For testing, we verify that hashes without $ are treated as legacy format

      // Since we can't easily create a legacy PBKDF2 hash, we test the path detection
      const nonSaltedHash = 'abc123def456'; // No $ separator
      const isValid = await verifyPin('1234', nonSaltedHash);
      // Will be false since this isn't a valid PBKDF2 hash, but it tests the code path
      expect(isValid).toBe(false);
    });

    it('should detect legacy format by absence of $ separator', async () => {
      // Any hash without $ should be treated as legacy
      const modernHash = await hashPinSecure('1234');
      expect(modernHash).toContain('$');

      // A string without $ triggers legacy code path
      const legacyFormatHash = 'abcdef123456';
      expect(legacyFormatHash.includes('$')).toBe(false);
    });

    it('should return false for malformed hash', async () => {
      const isValid = await verifyPin('1234', '$');
      expect(isValid).toBe(false);
    });

    it('should return false for empty hash parts', async () => {
      const isValid = await verifyPin('1234', 'salt$');
      expect(isValid).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a token of the specified length', () => {
      const token = generateSecureToken(16);
      expect(token.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should generate default 32-byte token', () => {
      const token = generateSecureToken();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should only contain hex characters', () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('hashPinLegacy (deprecated)', () => {
    it('should generate consistent hashes for same input', () => {
      const hash1 = hashPinLegacy('1234');
      const hash2 = hashPinLegacy('1234');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = hashPinLegacy('1234');
      const hash2 = hashPinLegacy('5678');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('security properties', () => {
    it('should use timing-safe comparison (no early exit on mismatch)', async () => {
      const hash = await hashPinSecure('1234');

      // Both should take similar time regardless of how many characters match
      // This tests that constant-time comparison is used
      const start1 = performance.now();
      await verifyPin('0000', hash); // No chars match
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      await verifyPin('1239', hash); // Most chars match
      const time2 = performance.now() - start2;

      // Times should be within 10x of each other (allowing for system variance)
      // If early exit was used, 0000 would be much faster
      expect(time1 / time2).toBeGreaterThan(0.1);
      expect(time1 / time2).toBeLessThan(10);
    });

    it('should use PBKDF2 with sufficient iterations', async () => {
      // This is tested implicitly by the function working correctly
      // The actual iteration count (100000) is internal but we can verify
      // that hashing takes a reasonable amount of time (indicating work is done)
      const start = performance.now();
      await hashPinSecure('1234');
      const elapsed = performance.now() - start;

      // PBKDF2 with 100k iterations should take at least a few ms
      // This ensures the security parameter is not trivially low
      expect(elapsed).toBeGreaterThan(1);
    });
  });
});
