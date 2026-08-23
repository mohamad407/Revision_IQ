import { geminiModel } from '../config/gemini.js';

// Gemini has an input limit; keep this generous but bounded so a huge
// lecture PDF doesn't blow the context window or the bill.
const MAX_INPUT_CHARS = 30000;

function truncate(text) {
  return text.length > MAX_INPUT_CHARS ? text.slice(0, MAX_INPUT_CHARS) : text;
}

// Strips markdown code fences Gemini sometimes wraps JSON in, then parses.
function parseJsonResponse(raw) {
  const cleaned = raw.replace(/```json\s*|```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * generateSummary(text) -> { headline, keyPoints: string[], raw }
 * All Gemini calls are isolated here so swapping providers later only
 * means editing this file.
 */
export async function generateSummary(text) {
  const prompt = `You are helping a student revise for an exam. Read the lecture
text below and return ONLY valid JSON (no markdown fences, no commentary) in
this exact shape:

{
  "headline": "one sentence describing what this document covers",
  "keyPoints": ["5 to 8 concise bullet points of the most important, exam-relevant facts"]
}

LECTURE TEXT:
"""
${truncate(text)}
"""`;

  const result = await geminiModel.generateContent(prompt);
  const raw = result.response.text();

  try {
    const parsed = parseJsonResponse(raw);
    return {
      headline: parsed.headline || 'Summary',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      raw,
    };
  } catch {
    // Fall back to storing the raw text if Gemini didn't return clean JSON —
    // better to show something than to fail the whole upload.
    return { headline: 'Summary', keyPoints: [], raw };
  }
}

/**
 * generateQuiz(text) -> Array<{ question, options: string[4], correctAnswer }>
 */
export async function generateQuiz(text) {
  const prompt = `You are creating a 5-question multiple-choice quiz from the
lecture text below, to test a student's understanding before an exam. Return
ONLY valid JSON (no markdown fences, no commentary) as an array of exactly 5
objects in this exact shape:

[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": "must be an exact copy of one of the 4 options"
  }
]

Rules:
- Questions must be answerable from the text, not general knowledge.
- Exactly 4 options per question, only one correct.
- Keep questions and options concise.

LECTURE TEXT:
"""
${truncate(text)}
"""`;

  const result = await geminiModel.generateContent(prompt);
  const raw = result.response.text();

  const parsed = parseJsonResponse(raw); // let this throw — caller decides how to handle a bad generation

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Gemini did not return a valid quiz array.');
  }

  return parsed
    .filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4 && q.correctAnswer)
    .slice(0, 5);
}
