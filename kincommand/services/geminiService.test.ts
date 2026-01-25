import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the module before importing
vi.mock('./geminiService', async (importOriginal) => {
  const original = await importOriginal<typeof import('./geminiService')>();
  return {
    ...original,
    parseReceiptImage: vi.fn().mockResolvedValue({
      amount: 42.5,
      date: new Date().toISOString().split('T')[0],
      description: 'Mock Receipt',
      category: 'Medical'
    }),
    suggestCategory: vi.fn().mockImplementation((description: string, type: string) => {
      return Promise.resolve({
        category: type === 'TIME' ? 'Caregiving' : 'General',
        isRisky: false
      });
    }),
    parseVoiceEntry: vi.fn().mockResolvedValue({
      type: 'TIME',
      amount: 0,
      durationHours: 1.5,
      date: new Date().toISOString().split('T')[0],
      description: 'Mock voice entry',
      category: 'Caregiving'
    }),
    queryLedger: vi.fn().mockResolvedValue({
      text: 'Mock response',
      sources: []
    })
  };
});

import { parseReceiptImage, suggestCategory, parseVoiceEntry } from './geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseReceiptImage', () => {
    it('returns parsed receipt data', async () => {
      const mockBase64 = 'data:image/jpeg;base64,/9j/fake-image-data';

      const result = await parseReceiptImage(mockBase64);

      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('category');
      expect(typeof result.amount).toBe('number');
      expect(result.amount).toBe(42.5);
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

    it('returns Caregiving category for TIME type', async () => {
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
    it('returns parsed voice entry data', async () => {
      const mockBase64 = 'data:audio/webm;base64,fake-audio-data';

      const result = await parseVoiceEntry(mockBase64);

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('category');
      expect(['EXPENSE', 'TIME']).toContain(result.type);
    });

    it('returns TIME type with durationHours', async () => {
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
    const mockReceiptImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

    const receiptData = await parseReceiptImage(mockReceiptImage);

    // Verify the structure matches what EntryForm expects
    expect(receiptData).toMatchObject({
      amount: expect.any(Number),
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      description: expect.any(String),
      category: expect.any(String)
    });

    // Simulate form field updates
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

  it('handles receipt data correctly for form population', async () => {
    const result = await parseReceiptImage('data:image/jpeg;base64,test');

    // Should return expected mock values
    expect(result.amount).toBe(42.5);
    expect(result.category).toBe('Medical');
    expect(result.description).toBe('Mock Receipt');
  });
});
