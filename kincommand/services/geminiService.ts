import { GoogleGenAI, Type } from "@google/genai";
import { LedgerEntry, MedicaidReportItem, FamilySettings, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to scrub PII if privacy mode is on
const anonymizeText = (text: string, settings: FamilySettings): string => {
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

export const analyzeLedgerForMedicaid = async (entries: LedgerEntry[], settings: FamilySettings): Promise<MedicaidReportItem[]> => {
  try {
    // Anonymize the data before sending to LLM
    const promptData = entries.map(e => ({
      id: e.id,
      description: anonymizeText(e.description, settings),
      amount: e.amount,
      type: e.type,
      date: e.date
    }));

    const prompt = `
      Analyze the following financial and time ledger entries for a family caring for an elderly parent.
      Context: We are preparing for a Medicaid Look-Back period (5 years).
      
      Task:
      1. Categorize each entry.
      2. Flag any transactions that might be construed as a "Gift" or "Uncompensated Transfer" which could jeopardize Medicaid eligibility.
      3. Mark legitimate care expenses (groceries, medical supplies, care hours) as 'COMPLIANT'.
      4. Mark suspicious items (cash withdrawals, large vague transfers, gifts to grandkids) as 'WARNING'.
      5. If unclear, mark as 'REVIEW_NEEDED'.

      Entries:
      ${JSON.stringify(promptData)}
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
              entryId: { type: Type.STRING },
              status: { type: Type.STRING, enum: ['COMPLIANT', 'WARNING', 'REVIEW_NEEDED'] },
              reason: { type: Type.STRING },
              categorySuggestion: { type: Type.STRING }
            },
            required: ['entryId', 'status', 'reason', 'categorySuggestion']
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MedicaidReportItem[];
    }
    return [];

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return [];
  }
};

export const suggestCategory = async (description: string, type: 'EXPENSE' | 'TIME', settings: FamilySettings): Promise<{ category: string, isRisky: boolean }> => {
  try {
    const cleanDescription = anonymizeText(description, settings);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Categorize this elder care ledger entry: "${cleanDescription}" (Type: ${type}). Return a generic category (e.g., Medical, Groceries, Caregiving, Utilities, Entertainment, Gift). Also, is this risky for Medicaid look-back (True/False)?`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            isRisky: { type: Type.BOOLEAN }
          },
          required: ['category', 'isRisky']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { category: 'Uncategorized', isRisky: false };
  } catch (e) {
    return { category: 'Uncategorized', isRisky: false };
  }
};

export const parseReceiptImage = async (base64Image: string): Promise<{ amount: number, date: string, description: string, category: string }> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Analyze this receipt. Extract the total amount, the date (in YYYY-MM-DD format), the merchant name (use as description), and a suitable category for elder care (e.g. Groceries, Medical, Pharmacy). If date is missing, use today."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ['amount', 'description', 'category']
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      // Ensure date fallback if AI fails or returns partial
      if (!result.date) result.date = new Date().toISOString().split('T')[0];
      return result;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Receipt parsing failed:", error);
    return { amount: 0, date: new Date().toISOString().split('T')[0], description: '', category: 'Uncategorized' };
  }
};

export const parseVoiceEntry = async (base64Audio: string): Promise<{ type: 'EXPENSE' | 'TIME', amount: number, date: string, description: string, category: string, durationHours?: number }> => {
  try {
    // Determine mimeType (assuming webm from MediaRecorder, or fallback)
    const mimeType = base64Audio.includes('audio/mp4') ? 'audio/mp4' : 'audio/webm';
    const cleanBase64 = base64Audio.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: `Listen to this voice note from a caregiver. Extract the transaction details.
            
            Rules:
            1. If they mention spending money, bought items, or costs, set type to 'EXPENSE'.
            2. If they mention spending time, driving, cleaning, or visiting, set type to 'TIME'.
            3. For TIME, extract 'durationHours' (e.g., 90 minutes = 1.5).
            4. For EXPENSE, extract 'amount'.
            5. Infer a category.
            6. If date is not mentioned, use today's date (${new Date().toISOString().split('T')[0]}).`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['EXPENSE', 'TIME'] },
            amount: { type: Type.NUMBER },
            durationHours: { type: Type.NUMBER },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ['type', 'description', 'category', 'date']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response");
  } catch (error) {
    console.error("Voice parsing failed:", error);
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

export const queryLedger = async (query: string, entries: LedgerEntry[], users: User[], settings: FamilySettings): Promise<{ text: string, sources: Array<{title: string, uri: string}> }> => {
  try {
    // 1. Prepare context by mapping User IDs to Names for the AI
    const enrichedEntries = entries.map(e => ({
      ...e,
      userName: users.find(u => u.id === e.userId)?.name || 'Unknown',
      description: anonymizeText(e.description, settings)
    }));

    // 2. Construct the prompt
    const prompt = `
      You are "Kin", a helpful family care assistant.
      
      You have access to two knowledge sources:
      1. The family's caregiving ledger (provided below).
      2. Google Search (for outside information like pharmacy hours, medication info, or elder care costs).

      Family Settings:
      - Patient: ${settings.patientName} (If Privacy Mode is active, refer to as 'The Patient')
      - Hourly Sweat Equity Rate: $${settings.hourlyRate}/hr
      
      Ledger Data:
      ${JSON.stringify(enrichedEntries)}

      User Question: "${query}"

      Instructions:
      - If the question is about the ledger (expenses, time, history), answer using the data provided.
      - If the question requires external knowledge (e.g. "find pharmacies", "medicare rules"), use Google Search.
      - Be empathetic but factual.
      - Keep responses concise (under 150 words).
    `;

    // 3. Call Gemini with Search Grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    // Extract grounding metadata if available
    const sources: Array<{title: string, uri: string}> = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
                sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
        });
    }

    return {
        text: response.text || "I'm sorry, I couldn't process that query.",
        sources: sources
    };

  } catch (error) {
    console.error("Chat query failed:", error);
    return { text: "I'm having trouble accessing the network right now. Please try again.", sources: [] };
  }
};