import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[gemini] GEMINI_API_KEY is not set — AI routes will fail.');
}

// Model names change often (1.5 / 2.0 are shut down, 2.5 is limited to projects that
// already used it). Set GEMINI_MODEL on Render to switch. Good choices as of Oct 2026:
//   gemini-3.5-flash-lite  -> cheap, fast, rarely overloaded
//   gemini-3.8-flash       -> better quality
export const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

// Popular models sometimes answer "503 high demand". When that happens we retry on a
// different model (separate capacity). Set GEMINI_FALLBACK_MODEL=off to disable.
const fallbackEnv = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
export const FALLBACK_MODEL =
  fallbackEnv.toLowerCase() === 'off' || fallbackEnv === MODEL ? null : fallbackEnv;

// Render's proxy cuts requests at ~100s; keep each attempt short so the browser
// always gets a clear JSON error instead of a CORS-looking proxy failure.
const REQUEST_OPTIONS = { timeout: Number(process.env.GEMINI_TIMEOUT_MS) || 40000 };

// Gemini 3 models "think" at HIGH by default: slow and billed as extra output. Our
// tasks don't need deep reasoning, so default to LOW (GEMINI_THINKING_LEVEL =
// minimal | low | medium | high | off). Older models (2.x) don't accept it.
const thinkingLevel = (process.env.GEMINI_THINKING_LEVEL || 'low').toLowerCase();
const thinkingFor = (name) =>
  /^gemini-3/.test(name) && thinkingLevel !== 'off' ? { thinkingConfig: { thinkingLevel } } : {};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function build(name, json) {
  return genAI.getGenerativeModel(
    {
      model: name,
      // No custom temperature: Gemini 3 models are tuned for their default.
      generationConfig: { ...(json ? { responseMimeType: 'application/json' } : {}), ...thinkingFor(name) },
    },
    REQUEST_OPTIONS
  );
}

const names = FALLBACK_MODEL ? [MODEL, FALLBACK_MODEL] : [MODEL];

// Ordered lists: [primary, fallback?]
export const jsonModels = names.map((n) => ({ name: n, model: build(n, true) }));
export const textModels = names.map((n) => ({ name: n, model: build(n, false) }));

export default genAI;
