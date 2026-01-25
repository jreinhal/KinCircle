import { GoogleGenAI, Type } from "@google/genai";
import { LedgerEntry, FamilySettings, User, EntryType } from "../types";
import { logger } from "../utils/logger";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

// --- AGENT 0: DATA INTEGRITY (UNIT TESTER) ---
// Deterministic checks for data validity
export const runDataIntegrityCheck = async (entries: LedgerEntry[], users: User[]): Promise<{ passed: boolean; issues: string[] }> => {
  const issues: string[] = [];
  const userIds = new Set(users.map(u => u.id));

  entries.forEach(entry => {
    // Check 1: Orphaned Records
    if (!userIds.has(entry.userId)) {
      issues.push(`Entry ${entry.id.slice(0, 8)}... assigned to unknown User ID: ${entry.userId}`);
    }

    // Check 2: Invalid Amounts
    if (entry.amount < 0) {
      issues.push(`Entry ${entry.id.slice(0, 8)}... has negative amount: ${entry.amount}`);
    }

    // Check 3: Missing Categories
    if (!entry.category || entry.category.trim() === '') {
      issues.push(`Entry ${entry.id.slice(0, 8)}... is missing a category.`);
    }

    // Check 4: Date Validity
    if (isNaN(Date.parse(entry.date))) {
      issues.push(`Entry ${entry.id.slice(0, 8)}... has invalid date format: ${entry.date}`);
    }
  });

  return {
    passed: issues.length === 0,
    issues
  };
};

// --- AGENT 1: SCENARIO SIMULATOR ---
// Generates synthetic data to test the app's handling of complex family situations.
export const runScenarioAgent = async (scenario: string, currentUserId: string): Promise<LedgerEntry[]> => {
  try {
    const prompt = `
      Act as a Data Generation Agent for a family caregiving app.
      Generate 3 realistic ledger entries for the scenario: "${scenario}".
      
      Constraints:
      - Mix of EXPENSE and TIME entries.
      - Use realistic amounts.
      - Dates should be within the last 30 days.
      - Return pure JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['EXPENSE', 'TIME'] },
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              timeDurationMinutes: { type: Type.NUMBER }
            },
            required: ['type', 'description', 'amount', 'category']
          }
        }
      }
    });

    if (response.text) {
      const rawData = JSON.parse(response.text);
      // Hydrate with app-specific IDs and dates
      return rawData.map((item: any) => ({
        ...item,
        id: crypto.randomUUID(),
        userId: currentUserId,
        date: new Date().toISOString().split('T')[0],
        amount: item.type === 'TIME' ? 0 : item.amount
      }));
    }
    return [];
  } catch (error) {
    logger.error("Scenario Agent failed:", error);
    return [];
  }
};

// --- AGENT 2: UX & FAIRNESS CRITIC ---
// Analyzes the current state of the ledger to give high-level feedback.
export const runUXAgent = async (entries: LedgerEntry[], users: User[], settings: FamilySettings): Promise<string> => {
  try {
    const summary = users.map(u => {
      const userEntries = entries.filter(e => e.userId === u.id);
      const total = userEntries.reduce((sum, e) => sum + e.amount, 0);
      return `${u.name}: $${total.toFixed(2)}`;
    }).join(', ');

    const prompt = `
      Act as a "Fairness & UX Agent". Analyze this family's ledger summary:
      [${summary}]
      
      The goal of the app is "Sibling Equity". 
      1. Is the current split fair? 
      2. Suggest one action the "under-contributor" could take to help.
      3. Keep it constructive and under 50 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate critique.";
  } catch (error) {
    return "UX Agent is offline.";
  }
};

// --- AGENT 3: PRIVACY AUDITOR ---
// Verifies if PII is leaking.
export const runPrivacyAgent = async (entries: LedgerEntry[], settings: FamilySettings): Promise<{ safe: boolean, leakedEntries: string[] }> => {
  if (!settings.privacyMode) return { safe: false, leakedEntries: [] };

  const name = settings.patientName.toLowerCase();
  const leaks = entries.filter(e => e.description.toLowerCase().includes(name));

  return {
    safe: leaks.length === 0,
    leakedEntries: leaks.map(e => e.id)
  };
};
