import { describe, it, expect, vi, beforeAll } from 'vitest';
import { parseReceiptImage, suggestCategory, parseVoiceEntry } from './geminiService';

// Note: Tests run in mock mode when VITE_GEMINI_MOCK is not 'false' or API key is missing

describe('geminiService', () => {
  describe('parseReceiptImage', () => {
    it('returns parsed receipt data in mock mode', async () => {
      const mockBase64 = 'data:image/jpeg;base64,/9j/fake-image-data';

      const result = await parseReceiptImage(mockBase64);

      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('category');
      expect(typeof result.amount).toBe('number');
      expect(result.amount).toBe(42.5); // Mock returns 42.5
      expect(result.category).toBe('Medical');
    });

    it('returns a valid date in YYYY-MM-DD format', async () => {
      const mockBase64 = 'data:image/png;base64,fake-data';

      const result = await parseReceiptImage(mockBase64);

      // Date should be in YYYY-MM-DD format
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('handles different image mime types', async () => {
      const jpegImage = 'data:image/jpeg;base64,/9j/fake';
      const pngImage = 'data:image/png;base64,iVBORw0fake';
      const webpImage = 'data:image/webp;base64,UklGRfake';

      // All should return valid results
      const jpegResult = await parseReceiptImage(jpegImage);
      const pngResult = await parseReceiptImage(pngImage);
      const webpResult = await parseReceiptImage(webpImage);

      expect(jpegResult.amount).toBe(42.5);
      expect(pngResult.amount).toBe(42.5);
      expect(webpResult.amount).toBe(42.5);
    });
  });

  describe('suggestCategory', () => {
    it('returns a category for EXPENSE type', async () => {
      const result = await suggestCategory('CVS Pharmacy prescription', 'EXPENSE', {
        hourlyRate: 25,
        patientName: 'Mom',
        privacyMode: false,
        autoLockEnabled: false,
        hasCompletedOnboarding: true
      });

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('isRisky');
      expect(typeof result.category).toBe('string');
      expect(typeof result.isRisky).toBe('boolean');
    });

    it('returns Caregiving category for TIME type in mock mode', async () => {
      const result = await suggestCategory('Drove mom to doctor', 'TIME', {
        hourlyRate: 25,
        patientName: 'Mom',
        privacyMode: false,
        autoLockEnabled: false,
        hasCompletedOnboarding: true
      });

      expect(result.category).toBe('Caregiving');
      expect(result.isRisky).toBe(false);
    });
  });

  describe('parseVoiceEntry', () => {
    it('returns parsed voice entry data in mock mode', async () => {
      const mockBase64 = 'data:audio/webm;base64,fake-audio-data';

      const result = await parseVoiceEntry(mockBase64);

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('category');
      expect(['EXPENSE', 'TIME']).toContain(result.type);
    });

    it('returns TIME type with durationHours in mock mode', async () => {
      const mockBase64 = 'data:audio/webm;base64,fake';

      const result = await parseVoiceEntry(mockBase64);

      expect(result.type).toBe('TIME');
      expect(result.durationHours).toBe(1.5);
      expect(result.category).toBe('Caregiving');
    });
  });
});

describe('Receipt scanning integration', () => {
  it('parses receipt and fills form fields correctly', async () => {
    // Simulate what EntryForm does when a receipt is scanned
    const mockReceiptImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

    const receiptData = await parseReceiptImage(mockReceiptImage);

    // Verify the structure matches what EntryForm expects
    expect(receiptData).toMatchObject({
      amount: expect.any(Number),
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      description: expect.any(String),
      category: expect.any(String)
    });

    // Simulate form field updates (this is what EntryForm does)
    const formState = {
      amount: receiptData.amount.toString(),
      date: receiptData.date,
      description: receiptData.description,
      category: receiptData.category
    };

    expect(formState.amount).toBe('42.5');
    expect(formState.category).toBe('Medical');
    expect(formState.description).toBe('Mock Receipt');
  });

  it('handles empty or invalid receipt gracefully', async () => {
    // Even with weird input, should not throw
    const weirdInput = '';

    const result = await parseReceiptImage(weirdInput);

    // Should return fallback values, not throw
    expect(result).toHaveProperty('amount');
    expect(result).toHaveProperty('date');
  });
});
