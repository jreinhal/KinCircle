import { FamilySettings } from "../types";

// Helper to scrub PII if privacy mode is on
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper to scrub PII if privacy mode is on
export const anonymizeText = (text: string, settings: FamilySettings, extraNames: string[] = []): string => {
    if (!settings.privacyMode) return text;

    let cleanText = text;

    const names = [settings.patientName, ...extraNames]
        .filter(Boolean)
        .map(name => name.trim())
        .filter(Boolean);

    // Scrub known names (patient + user names)
    names.forEach((name) => {
        const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
        cleanText = cleanText.replace(regex, '[REDACTED]');
    });

    // Scrub Emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    cleanText = cleanText.replace(emailRegex, '[EMAIL_REDACTED]');

    // Scrub Phone Numbers (Generic North American formats)
    const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    cleanText = cleanText.replace(phoneRegex, '[PHONE_REDACTED]');

    // Scrub SSN-like patterns (XXX-XX-XXXX)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    cleanText = cleanText.replace(ssnRegex, '[SSN_REDACTED]');

    return cleanText;
};
