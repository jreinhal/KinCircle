import { describe, it, expect } from 'vitest';
import { anonymizeText } from './privacyUtils';
import { FamilySettings } from '../types';

const mockSettings: FamilySettings = {
    hourlyRate: 20,
    patientName: 'Martha Jones',
    privacyMode: true,
    autoLockEnabled: false,
    hasCompletedOnboarding: true
};

describe('privacyUtils', () => {
    it('should return original text if privacyMode is false', () => {
        const settings = { ...mockSettings, privacyMode: false };
        const text = 'Call Martha at 555-1234';
        expect(anonymizeText(text, settings)).toBe(text);
    });

    it('should redacted patient name', () => {
        const text = 'Meeting with Martha Jones today.';
        expect(anonymizeText(text, mockSettings)).toBe('Meeting with [REDACTED] today.');
    });

    it('should redact emails', () => {
        const text = 'Email me at test.user@example.com please.';
        expect(anonymizeText(text, mockSettings)).toBe('Email me at [EMAIL_REDACTED] please.');
    });

    it('should redact phone numbers', () => {
        const text = 'Call 555-123-4567 or (555) 123-4567';
        expect(anonymizeText(text, mockSettings)).toBe('Call [PHONE_REDACTED] or [PHONE_REDACTED]');
    });

    it('should redact SSN-like patterns', () => {
        const text = 'ID is 123-45-6789';
        expect(anonymizeText(text, mockSettings)).toBe('ID is [SSN_REDACTED]');
    });
});
