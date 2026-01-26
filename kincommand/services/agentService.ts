import { LedgerEntry, FamilySettings, User, EntryType } from "../types";
import { logger } from "../utils/logger";
import { anonymizeText } from "../utils/privacyUtils";
import { agentRateLimiter, RateLimitError } from "../utils/rateLimit";

const mockFlag = import.meta.env.VITE_GEMINI_MOCK;
const shouldMock = mockFlag !== 'false';
const apiBase = import.meta.env.VITE_API_BASE_URL || '';

const buildPrivacySafePayload = (
  entries: LedgerEntry[],
  users: User[],
  settings: FamilySettings
) => {
  if (!settings.privacyMode) {
    return { entries, users, settings };
  }

  const knownNames = users.map(u => u.name).filter(Boolean);
  const scrubbedEntries = entries.map(entry => ({
    ...entry,
    description: anonymizeText(entry.description, settings, knownNames)
  }));

  const scrubbedUsers = users.map((user, idx) => ({
    ...user,
    name: `Family Member ${idx + 1}`
  }));

  const scrubbedSettings = {
    ...settings,
    patientName: 'The Patient'
  };

  return { entries: scrubbedEntries, users: scrubbedUsers, settings: scrubbedSettings };
};

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
  if (shouldMock) {
    return [
      {
        id: crypto.randomUUID(),
        userId: currentUserId,
        type: EntryType.EXPENSE,
        description: 'Mock scenario expense',
        amount: 120.5,
        category: 'Medical',
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: crypto.randomUUID(),
        userId: currentUserId,
        type: EntryType.TIME,
        description: 'Mock scenario caregiving',
        amount: 0,
        timeDurationMinutes: 90,
        category: 'Caregiving',
        date: new Date().toISOString().split('T')[0]
      }
    ];
  }

  try {
    if (!agentRateLimiter.isAllowed()) {
      const resetTime = agentRateLimiter.getResetTime();
      logger.warn('Rate limit exceeded for scenario agent', { resetTime });
      throw new RateLimitError(resetTime);
    }

    const response = await fetch(`${apiBase}/api/agent/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, currentUserId })
    });

    if (!response.ok) {
      throw new Error(`Scenario agent failed (${response.status})`);
    }

    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    if (error instanceof RateLimitError) {
      logger.warn('Scenario agent rate limited', { resetInMs: error.resetInMs });
      return [];
    }
    logger.error("Scenario Agent failed:", error);
    return [];
  }
};

// --- AGENT 2: UX & FAIRNESS CRITIC ---
// Analyzes the current state of the ledger to give high-level feedback.
export const runUXAgent = async (entries: LedgerEntry[], users: User[], settings: FamilySettings): Promise<string> => {
  if (shouldMock) {
    return 'Mock UX feedback: consider balancing tasks and expenses.';
  }

  try {
    if (!agentRateLimiter.isAllowed()) {
      const resetTime = agentRateLimiter.getResetTime();
      logger.warn('Rate limit exceeded for UX agent', { resetTime });
      return `Agent Lab is rate-limited. Try again in ${Math.ceil(resetTime / 1000)}s.`;
    }

    const { entries: safeEntries, users: safeUsers, settings: safeSettings } =
      buildPrivacySafePayload(entries, users, settings);

    const response = await fetch(`${apiBase}/api/agent/ux`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: safeEntries, users: safeUsers, settings: safeSettings })
    });

    if (!response.ok) {
      throw new Error(`UX agent failed (${response.status})`);
    }

    const data = await response.json();
    return data.text || 'Unable to generate critique.';
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
