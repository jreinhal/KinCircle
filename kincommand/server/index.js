import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();
dotenv.config({ path: '.env.local' });

const PORT = process.env.KIN_API_PORT || 8787;
const HOST = process.env.KIN_API_HOST || '127.0.0.1';
const apiKey = process.env.GEMINI_API_KEY;
const apiToken = process.env.KIN_API_TOKEN;

const allowedOrigins = (process.env.KIN_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOrigins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

const requirePrivacy = process.env.KIN_PRIVACY_REQUIRED === 'true';
const rateWindowMs = Number(process.env.KIN_RATE_LIMIT_WINDOW_MS || 60_000);
const apiRateLimitMax = Number(process.env.KIN_RATE_LIMIT_MAX || 60);
const aiRateLimitMax = Number(process.env.KIN_AI_RATE_LIMIT_MAX || 20);

const enforceApiToken = (req, res, next) => {
  if (!apiToken) return next();
  const authHeader = req.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const headerToken = req.get('x-kin-api-key') || bearer;
  if (!headerToken || headerToken !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

const createRateLimiter = (maxRequests) => {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start >= rateWindowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((rateWindowMs - (now - entry.start)) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Rate limit exceeded', retryAfterSeconds: retryAfter });
    }
    entry.count += 1;
    return next();
  };
};

export const buildApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS blocked'));
    },
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  const apiLimiter = createRateLimiter(apiRateLimitMax);
  const aiLimiter = createRateLimiter(aiRateLimitMax);

const getAi = () => {
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  return new GoogleGenAI({ apiKey });
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const settingsSchema = z.object({
  privacyMode: z.boolean().optional(),
  patientName: z.string().optional(),
  hourlyRate: z.number().optional()
}).passthrough();

const ledgerEntrySchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().optional(),
  type: z.string().optional(),
  date: z.string().optional()
}).passthrough();

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional()
}).passthrough();

const medicaidSchema = z.object({
  entries: z.array(ledgerEntrySchema).optional(),
  settings: settingsSchema.optional()
});

const categorySchema = z.object({
  description: z.string(),
  type: z.enum(['EXPENSE', 'TIME']),
  settings: settingsSchema.optional()
});

const receiptSchema = z.object({
  base64Image: z.string()
});

const voiceSchema = z.object({
  base64Audio: z.string()
});

const querySchema = z.object({
  query: z.string(),
  entries: z.array(ledgerEntrySchema).optional(),
  users: z.array(userSchema).optional(),
  settings: settingsSchema.optional()
});

const uxSchema = z.object({
  entries: z.array(ledgerEntrySchema).optional(),
  users: z.array(userSchema).optional(),
  settings: settingsSchema.optional()
});

const scenarioSchema = z.object({
  scenario: z.string(),
  currentUserId: z.string().optional()
});

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body || {});
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  req.body = result.data;
  return next();
};

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

  app.use('/api', enforceApiToken, apiLimiter);

  app.post('/api/medicaid', aiLimiter, validateBody(medicaidSchema), async (req, res) => {
    try {
      const { entries = [], settings = {} } = req.body || {};
      const ai = getAi();
      const effectiveSettings = requirePrivacy ? { ...settings, privacyMode: true } : settings;

      const promptData = entries.map((e) => ({
        id: e.id,
        description: anonymizeText(e.description, effectiveSettings),
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

  app.post('/api/suggest-category', aiLimiter, validateBody(categorySchema), async (req, res) => {
    try {
      const { description, type, settings = {} } = req.body || {};
      const ai = getAi();
      const effectiveSettings = requirePrivacy ? { ...settings, privacyMode: true } : settings;
      const cleanDescription = anonymizeText(description, effectiveSettings);

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

  app.post('/api/parse-receipt', aiLimiter, validateBody(receiptSchema), async (req, res) => {
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

  app.post('/api/parse-voice', aiLimiter, validateBody(voiceSchema), async (req, res) => {
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

  app.post('/api/query-ledger', aiLimiter, validateBody(querySchema), async (req, res) => {
    try {
      const { query, entries = [], users = [], settings = {} } = req.body || {};
      const ai = getAi();
      const userNames = users.map((u) => u.name).filter(Boolean);

      const effectiveSettings = requirePrivacy ? { ...settings, privacyMode: true } : settings;
      const enrichedEntries = entries.map((e) => ({
        ...e,
        userName: effectiveSettings.privacyMode ? 'Family Member' : (users.find(u => u.id === e.userId)?.name || 'Unknown'),
        description: anonymizeText(e.description, effectiveSettings, userNames)
      }));

      const patientLabel = effectiveSettings.privacyMode ? 'The Patient' : (effectiveSettings.patientName || 'The Patient');

      const prompt = `
        You are "Kin", a helpful family care assistant.
        
        You have access to two knowledge sources:
        1. The family's caregiving ledger (provided below).
        2. Google Search (for outside information like pharmacy hours, medication info, or elder care costs).

        Family Settings:
        - Patient: ${patientLabel}
        - Care Time Value: $${effectiveSettings.hourlyRate}/hr

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

  app.post('/api/agent/scenario', aiLimiter, validateBody(scenarioSchema), async (req, res) => {
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

  app.post('/api/agent/ux', aiLimiter, validateBody(uxSchema), async (req, res) => {
    try {
      const { entries = [], users = [], settings = {} } = req.body || {};
      const ai = getAi();
      const effectiveSettings = requirePrivacy ? { ...settings, privacyMode: true } : settings;

      const summary = users.map(u => {
        const userEntries = entries.filter(e => e.userId === u.id);
        const total = userEntries.reduce((sum, e) => sum + e.amount, 0);
        const name = effectiveSettings.privacyMode ? 'Family Member' : u.name;
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

  return app;
};

export const app = buildApp();

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  app.listen(PORT, HOST, () => {
    console.log(`KinCircle API listening on http://${HOST}:${PORT}`);
  });
}
