import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[gemini] GEMINI_API_KEY is not set — AI routes will fail.');
}

// Model names change often. gemini-1.5-* and 2.0-* are shut down, and gemini-2.5-*
// is now limited to projects that already used it (new projects get a 404).
// Google recommends gemini-3.5-flash-lite (cheap, fast) or gemini-3.8-flash
// (higher quality). Set GEMINI_MODEL in the environment to switch — NOTE that a
// GEMINI_MODEL variable already set on Render overrides this default.
export const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

// Render's proxy cuts requests at ~100s. Two attempts x 40s keeps us under that,
// so the browser gets a clear JSON error instead of a CORS-looking proxy failure.
const REQUEST_OPTIONS = { timeout: Number(process.env.GEMINI_TIMEOUT_MS) || 40000 };

// Gemini 3 models "think" at HIGH by default: slow (often 30-90s on a long
// lecture) and billed as extra output. Our tasks (summaries, quizzes, cards) don't
// need deep reasoning, so default to LOW. Override with GEMINI_THINKING_LEVEL
// (minimal | low | medium | high | off). Older models (2.x) don't accept it.
const thinkingLevel = (process.env.GEMINI_THINKING_LEVEL || 'low').toLowerCase();
const isGemini3 = /^gemini-3/.test(MODEL);
const thinkingConfig =
  isGemini3 && thinkingLevel !== 'off' ? { thinkingConfig: { thinkingLevel } } : {};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Plain-text model (used for OCR / transcription).
export const geminiModel = genAI.getGenerativeModel(
  { model: MODEL, generationConfig: { ...thinkingConfig } },
  REQUEST_OPTIONS
);

// JSON-mode model: Gemini is forced to return valid JSON, which removes most
// "```json fence" / malformed-output failures.
export const geminiJsonModel = genAI.getGenerativeModel(
  {
    model: MODEL,
    // No custom temperature: Gemini 3 models are tuned for their default.
    generationConfig: { responseMimeType: 'application/json', ...thinkingConfig },
  },
  REQUEST_OPTIONS
);

export default genAI;
