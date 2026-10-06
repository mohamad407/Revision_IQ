import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[gemini] GEMINI_API_KEY is not set — AI routes will fail.');
}

// gemini-1.5-* models have been retired. Override with GEMINI_MODEL if Google
// renames/deprecates the default again.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const REQUEST_OPTIONS = { timeout: Number(process.env.GEMINI_TIMEOUT_MS) || 60000 };

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Plain-text model (used for OCR / transcription).
export const geminiModel = genAI.getGenerativeModel({ model: MODEL }, REQUEST_OPTIONS);

// JSON-mode model: Gemini is forced to return valid JSON, which removes most
// "```json fence" / malformed-output failures.
export const geminiJsonModel = genAI.getGenerativeModel(
  {
    model: MODEL,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
  },
  REQUEST_OPTIONS
);

export default genAI;
