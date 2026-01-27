import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();
dotenv.config({ path: '.env.local' });

const PORT = process.env.KIN_API_PORT || 8787;
const apiKey = process.env.GEMINI_API_KEY;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const getAi = () => {
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  return new GoogleGenAI({ apiKey });
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const anonymizeText = (text, settings, extraNames = []) => {
  if (!settings?.privacyMode || !text) return text;
  let cleanText = String(text);

  const names = [settings?.patientName, ...extraNames]
    .filter(Boolean)
    .map(name => name.trim())
    .filter(Boolean);

  names.forEach((name) => {
    const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
    cleanText = cleanText.replace(regex, '[REDACTED]');
  });

  cleanText = cleanText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
  cleanText = cleanText.replace(/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[PHONE_REDACTED]');
  cleanText = cleanText.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');

  return cleanText;
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/medicaid', async (req, res) => {
  try {
    const { entries = [], settings = {} } = req.body || {};
    const ai = getAi();

    const promptData = entries.map((e) => ({
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
        responseMimeType: 'application/json',
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

    res.json({ items: response.text ? JSON.parse(response.text) : [] });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Medicaid analysis failed' });
  }
});

app.post('/api/suggest-category', async (req, res) => {
  try {
    const { description, type, settings = {} } = req.body || {};
    const ai = getAi();
    const cleanDescription = anonymizeText(description, settings);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Categorize this elder care ledger entry: "${cleanDescription}" (Type: ${type}). Return a generic category (e.g., Medical, Groceries, Caregiving, Utilities, Entertainment, Gift). Also, is this risky for Medicaid look-back (True/False)?`,
      config: {
        responseMimeType: 'application/json',
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

    res.json(response.text ? JSON.parse(response.text) : { category: 'Uncategorized', isRisky: false });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Category suggestion failed' });
  }
});

app.post('/api/parse-receipt', async (req, res) => {
  try {
    const { base64Image } = req.body || {};
    const ai = getAi();
    const cleanBase64 = String(base64Image || '').replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

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
            text: 'Analyze this receipt. Extract the total amount, the date (in YYYY-MM-DD format), the merchant name (use as description), and a suitable category for elder care (e.g. Groceries, Medical, Pharmacy). If date is missing, use today.'
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
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

    res.json(response.text ? JSON.parse(response.text) : { amount: 0, date: new Date().toISOString().split('T')[0], description: '', category: 'Uncategorized' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Receipt parsing failed' });
  }
});

app.post('/api/parse-voice', async (req, res) => {
  try {
    const { base64Audio } = req.body || {};
    const ai = getAi();
    const mimeType = String(base64Audio || '').includes('audio/mp4') ? 'audio/mp4' : 'audio/webm';
    const cleanBase64 = String(base64Audio || '').split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
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
        responseMimeType: 'application/json',
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

    res.json(response.text ? JSON.parse(response.text) : {});
  } catch (error) {
    res.status(500).json({ error: error.message || 'Voice parsing failed' });
  }
});

app.post('/api/query-ledger', async (req, res) => {
  try {
    const { query, entries = [], users = [], settings = {} } = req.body || {};
    const ai = getAi();
    const userNames = users.map((u) => u.name).filter(Boolean);

    const enrichedEntries = entries.map((e) => ({
      ...e,
      userName: settings.privacyMode ? 'Family Member' : (users.find(u => u.id === e.userId)?.name || 'Unknown'),
      description: anonymizeText(e.description, settings, userNames)
    }));

    const patientLabel = settings.privacyMode ? 'The Patient' : (settings.patientName || 'The Patient');

    const prompt = `
      You are "Kin", a helpful family care assistant.
      
      You have access to two knowledge sources:
      1. The family's caregiving ledger (provided below).
      2. Google Search (for outside information like pharmacy hours, medication info, or elder care costs).

      Family Settings:
      - Patient: ${patientLabel}
      - Care Time Value: $${settings.hourlyRate}/hr

      Ledger Data:
      ${JSON.stringify(enrichedEntries)}

      User Question: "${query}"

      Instructions:
      - If the question is about the ledger (expenses, time, history), answer using the data provided.
      - If the question requires external knowledge (e.g. "find pharmacies", "medicare rules"), use Google Search.
      - Be empathetic but factual.
      - Keep responses concise (under 150 words).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const sources = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk) => {
      if (chunk.web) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });

    res.json({ text: response.text || "I'm sorry, I couldn't process that query.", sources });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Query failed' });
  }
});

app.post('/api/agent/scenario', async (req, res) => {
  try {
    const { scenario, currentUserId } = req.body || {};
    const ai = getAi();

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
        responseMimeType: 'application/json',
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

    const rawData = response.text ? JSON.parse(response.text) : [];
    const hydrated = rawData.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      userId: currentUserId,
      date: new Date().toISOString().split('T')[0],
      amount: item.type === 'TIME' ? 0 : item.amount
    }));

    res.json({ entries: hydrated });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Scenario agent failed' });
  }
});

app.post('/api/agent/ux', async (req, res) => {
  try {
    const { entries = [], users = [], settings = {} } = req.body || {};
    const ai = getAi();

    const summary = users.map(u => {
      const userEntries = entries.filter(e => e.userId === u.id);
      const total = userEntries.reduce((sum, e) => sum + e.amount, 0);
      const name = settings.privacyMode ? 'Family Member' : u.name;
      return `${name}: $${total.toFixed(2)}`;
    }).join(', ');

    const prompt = `
      Act as a "Fairness & UX Agent". Analyze this family's ledger summary:
      [${summary}]
      
      The goal of the app is "Care Equity". 
      1. Is the current split fair? 
      2. Suggest one action the "under-contributor" could take to help.
      3. Keep it constructive and under 50 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    res.json({ text: response.text || 'Unable to generate critique.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'UX agent failed' });
  }
});

app.listen(PORT, () => {
  console.log(`KinCircle API listening on http://localhost:${PORT}`);
});
