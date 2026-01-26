import { LedgerEntry, MedicaidReportItem, FamilySettings, User } from "../types";
import { anonymizeText } from "../utils/privacyUtils";
import { geminiRateLimiter, chatRateLimiter, receiptScanRateLimiter, RateLimitError } from "../utils/rateLimit";
import { logger } from "../utils/logger";
import { isOcrServiceAvailable, ocrReceipt as lightOnOcrReceipt, isOcrEnabled } from "./ocrService";

const mockFlag = import.meta.env.VITE_GEMINI_MOCK;
const isMock = mockFlag !== 'false';
const shouldMock = isMock;
const apiBase = import.meta.env.VITE_API_BASE_URL || '';

export const analyzeLedgerForMedicaid = async (entries: LedgerEntry[], settings: FamilySettings): Promise<MedicaidReportItem[]> => {
  if (shouldMock) {
    return entries.map(entry => ({
      entryId: entry.id,
      status: 'COMPLIANT',
      reason: 'Mock analysis',
      categorySuggestion: entry.category || 'General'
    }));
  }

  // Check rate limit
  if (!geminiRateLimiter.isAllowed()) {
    const resetTime = geminiRateLimiter.getResetTime();
    logger.warn('Rate limit exceeded for Medicaid analysis', { resetTime });
    throw new RateLimitError(resetTime);
  }

  try {
    const promptData = entries.map(e => ({
      ...e,
      description: anonymizeText(e.description, settings)
    }));

    const response = await fetch(`${apiBase}/api/medicaid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: promptData, settings })
    });

    if (!response.ok) {
      throw new Error(`Medicaid analysis failed (${response.status})`);
    }

    const data = await response.json();
    return data.items || [];

  } catch (error) {
    logger.error("Gemini analysis failed:", error);
    return [];
  }
};

export const suggestCategory = async (description: string, type: 'EXPENSE' | 'TIME', settings: FamilySettings): Promise<{ category: string, isRisky: boolean }> => {
  if (shouldMock) {
    return { category: type === 'TIME' ? 'Caregiving' : 'General', isRisky: false };
  }

  // Check rate limit
  if (!geminiRateLimiter.isAllowed()) {
    const resetTime = geminiRateLimiter.getResetTime();
    logger.warn('Rate limit exceeded for category suggestion', { resetTime });
    throw new RateLimitError(resetTime);
  }

  try {
    const cleanDescription = anonymizeText(description, settings);
    const response = await fetch(`${apiBase}/api/suggest-category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: cleanDescription, type, settings })
    });

    if (!response.ok) {
      throw new Error(`Category suggestion failed (${response.status})`);
    }

    return await response.json();
  } catch (e) {
    return { category: 'Uncategorized', isRisky: false };
  }
};

export const parseReceiptImage = async (base64Image: string): Promise<{ amount: number, date: string, description: string, category: string }> => {
  if (shouldMock) {
    return {
      amount: 42.5,
      date: new Date().toISOString().split('T')[0],
      description: 'Mock Receipt',
      category: 'Medical'
    };
  }

  // Check rate limit - receipt scanning has stricter limits
  if (!receiptScanRateLimiter.isAllowed()) {
    const resetTime = receiptScanRateLimiter.getResetTime();
    logger.warn('Rate limit exceeded for receipt scanning', { resetTime });

    // Try LightOnOCR as fallback when rate limited
    if (isOcrEnabled()) {
      logger.info('Attempting LightOnOCR fallback due to rate limit');
      try {
        const ocrAvailable = await isOcrServiceAvailable();
        if (ocrAvailable) {
          return await lightOnOcrReceipt(base64Image);
        }
      } catch (ocrError) {
        logger.warn('LightOnOCR fallback failed:', ocrError);
      }
    }

    throw new RateLimitError(resetTime);
  }

  try {
    const response = await fetch(`${apiBase}/api/parse-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image })
    });

    if (!response.ok) {
      throw new Error(`Receipt parsing failed (${response.status})`);
    }

    const result = await response.json();
    if (!result.date) result.date = new Date().toISOString().split('T')[0];
    return result;
  } catch (error) {
    logger.error("Receipt parsing failed:", error);
    return { amount: 0, date: new Date().toISOString().split('T')[0], description: '', category: 'Uncategorized' };
  }
};

export const parseVoiceEntry = async (base64Audio: string): Promise<{ type: 'EXPENSE' | 'TIME', amount: number, date: string, description: string, category: string, durationHours?: number }> => {
  if (shouldMock) {
    return {
      type: 'TIME',
      amount: 0,
      durationHours: 1.5,
      date: new Date().toISOString().split('T')[0],
      description: 'Mock voice entry',
      category: 'Caregiving'
    };
  }

  // Check rate limit
  if (!geminiRateLimiter.isAllowed()) {
    const resetTime = geminiRateLimiter.getResetTime();
    logger.warn('Rate limit exceeded for voice parsing', { resetTime });
    throw new RateLimitError(resetTime);
  }

  try {
    const response = await fetch(`${apiBase}/api/parse-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Audio })
    });

    if (!response.ok) {
      throw new Error(`Voice parsing failed (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    logger.error("Voice parsing failed:", error);
    // Return a safe fallback so the app doesn't crash
    return {
      type: 'EXPENSE',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: 'Uncategorized'
    };
  }
};

export const queryLedger = async (query: string, entries: LedgerEntry[], users: User[], settings: FamilySettings): Promise<{ text: string, sources: Array<{ title: string, uri: string }> }> => {
  if (shouldMock) {
    const expenseTotal = entries
      .filter(entry => entry.type === 'EXPENSE')
      .reduce((sum, entry) => sum + entry.amount, 0);
    return {
      text: `Mock response: "${query}" (Total expenses: $${expenseTotal.toFixed(2)})`,
      sources: []
    };
  }

  // Check rate limit for chat queries
  if (!chatRateLimiter.isAllowed()) {
    const resetTime = chatRateLimiter.getResetTime();
    logger.warn('Rate limit exceeded for chat query', { resetTime });
    throw new RateLimitError(resetTime);
  }

  const userNames = users.map(u => u.name).filter(Boolean);
  const sanitizedUsers = settings.privacyMode
    ? users.map((u, idx) => ({ ...u, name: `Family Member ${idx + 1}` }))
    : users;
  const sanitizedEntries = entries.map(e => ({
    ...e,
    description: anonymizeText(e.description, settings, userNames)
  }));

  try {
    const response = await fetch(`${apiBase}/api/query-ledger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, entries: sanitizedEntries, users: sanitizedUsers, settings })
    });

    if (!response.ok) {
      throw new Error(`Query failed (${response.status})`);
    }

    return await response.json();

  } catch (error) {
    logger.warn("Chat query failed with search grounding, retrying without search.", error);

    try {
      const fallbackResponse = await fetch(`${apiBase}/api/query-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, entries: sanitizedEntries, users: sanitizedUsers, settings })
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Fallback query failed (${fallbackResponse.status})`);
      }

      return await fallbackResponse.json();
    } catch (fallbackError) {
      logger.error("Chat query failed:", fallbackError);
      return { text: "I'm having trouble accessing the network right now. Please try again.", sources: [] };
    }
  }
};
