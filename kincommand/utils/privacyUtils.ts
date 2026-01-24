import { FamilySettings } from "../types";

// Helper to scrub PII if privacy mode is on
export const anonymizeText = (text: string, settings: FamilySettings): string => {
    if (!settings.privacyMode) return text;

    let cleanText = text;

    // 1. Scrub Patient Name (Case insensitive)
    if (settings.patientName) {
        const regex = new RegExp(settings.patientName, 'gi');
        cleanText = cleanText.replace(regex, '[PATIENT]');
    }

    // 2. Scrub Emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    cleanText = cleanText.replace(emailRegex, '[EMAIL_REDACTED]');

    // 3. Scrub Phone Numbers (Generic North American formats)
    const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    cleanText = cleanText.replace(phoneRegex, '[PHONE_REDACTED]');

    // 4. Scrub SSN-like patterns (XXX-XX-XXXX)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    cleanText = cleanText.replace(ssnRegex, '[SSN_REDACTED]');

    return cleanText;
};
