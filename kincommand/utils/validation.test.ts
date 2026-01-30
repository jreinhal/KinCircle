import { describe, it, expect } from 'vitest';
import { entryFormSchema, validateData, formatZodErrors } from './validation';
import { EntryType } from '../types';

describe('validation utilities', () => {
  it('validateData returns success for valid payload', () => {
    const payload = {
      type: EntryType.EXPENSE,
      description: 'Groceries',
      amount: 25,
      category: 'Food',
      date: '2026-01-01'
    };

    const result = validateData(entryFormSchema, payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Groceries');
    }
  });

  it('formatZodErrors returns readable messages', () => {
    const payload = {
      type: EntryType.EXPENSE,
      description: '',
      amount: -1,
      category: '',
      date: '01-01-2026'
    };

    const result = validateData(entryFormSchema, payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = formatZodErrors(result.errors);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.join(' ')).toMatch(/description|amount|category|date/i);
    }
  });
});
