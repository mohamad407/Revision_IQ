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

/**
 * predictQuestions({ subject, syllabusText, pattern, pastPapersText })
 * -> { cat1: PredictedQuestion[], cat2: PredictedQuestion[], fat: PredictedQuestion[] }
 *
 * Cross-references the syllabus, the user-entered exam pattern for each
 * stage, and the text of any uploaded previous papers to predict likely
 * questions per stage. Runs one Gemini call per stage that has a pattern
 * defined (numQuestions > 0) so each stage gets a focused prompt instead
 * of one call trying to juggle all three at once.
 */
export async function predictQuestions({ subject, syllabusText, pattern, pastPapersText }) {
  const stages = ['cat1', 'cat2', 'fat'];
  const results = { cat1: [], cat2: [], fat: [] };

  for (const stage of stages) {
    const stagePattern = pattern?.[stage];
    if (!stagePattern || !stagePattern.numQuestions) continue; // user didn't define this stage — skip it

    const label = stage === 'fat' ? 'FAT (Final Assessment Test)' : stage.toUpperCase();

    const prompt = `You are helping a student predict likely exam questions for
${label} in the subject "${subject}".

EXAM PATTERN FOR ${label} (entered by the student — follow it exactly):
- Number of questions: ${stagePattern.numQuestions}
- Marks per question: ${stagePattern.marksPerQuestion || 'not specified'}
- Question type: ${stagePattern.questionType || 'not specified'}
- Topics/modules covered: ${stagePattern.topics || 'not specified'}
- Additional notes: ${stagePattern.notes || 'none'}

SYLLABUS:
"""
${truncate(syllabusText || 'No syllabus provided.')}
"""

TEXT EXTRACTED FROM PREVIOUS SEMESTERS' PAPERS (may cover multiple stages —
use it to spot recurring topics and question styles, not exact repeats):
"""
${truncate(pastPapersText || 'No previous papers provided.')}
"""

Return ONLY valid JSON (no markdown fences, no commentary): an array of
exactly ${stagePattern.numQuestions} objects, each shaped like:

{
  "topic": "the module/topic this question is drawn from",
  "question": "the predicted question, written in the requested question type/style",
  "likelihood": "high | medium | low",
  "reasoning": "one short sentence on why this topic is likely to appear"
}`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const raw = result.response.text();
      const parsed = parseJsonResponse(raw);
      if (Array.isArray(parsed)) {
        results[stage] = parsed.filter((q) => q.topic && q.question);
      }
    } catch (err) {
      // One stage failing (e.g. Gemini hiccup) shouldn't take down the
      // others — leave that stage empty and let the caller/UI surface it.
      results[stage] = [];
    }
  }

  return results;
}

/**
 * extractTextFromImage(base64Data, mimeType) -> string
 * Uses Gemini's vision capability to transcribe a photographed/scanned
 * question paper directly — more reliable than traditional OCR for messy
 * phone photos, and keeps every past-paper source going through one
 * Gemini-backed pipeline instead of bolting on a separate OCR library.
 */
export async function extractTextFromImage(base64Data, mimeType) {
  const prompt = `This image is a photo or scan of an exam question paper.
Transcribe all the text you can read from it as plain text, preserving
question numbers and structure as best you can. If parts are blurry or
illegible, skip them rather than guessing. Return only the transcribed
text, no commentary.`;

  const result = await geminiModel.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType } },
  ]);

  return result.response.text().trim();
}

/**
 * generateModelPaper({ subject, syllabusText, pattern, pastPapersText })
 * -> { cat1: PaperQuestion[], cat2: PaperQuestion[], fat: PaperQuestion[] }
 *
 * Unlike predictQuestions (which ranks likely questions), this assembles a
 * complete, ready-to-practice paper per stage — every question the user's
 * pattern calls for, numbered and marked, in exam format.
 */
export async function generateModelPaper({ subject, syllabusText, pattern, pastPapersText }) {
  const stages = ['cat1', 'cat2', 'fat'];
  const results = { cat1: [], cat2: [], fat: [] };

  for (const stage of stages) {
    const stagePattern = pattern?.[stage];
    if (!stagePattern || !stagePattern.numQuestions) continue;

    const label = stage === 'fat' ? 'FAT (Final Assessment Test)' : stage.toUpperCase();

    const prompt = `You are writing a full model exam paper for ${label} in the
subject "${subject}", to help a student practice under realistic conditions.

EXAM PATTERN FOR ${label} (entered by the student — follow it exactly):
- Number of questions: ${stagePattern.numQuestions}
- Marks per question: ${stagePattern.marksPerQuestion || 'not specified'}
- Question type: ${stagePattern.questionType || 'not specified'}
- Topics/modules covered: ${stagePattern.topics || 'not specified'}
- Additional notes: ${stagePattern.notes || 'none'}

SYLLABUS:
"""
${truncate(syllabusText || 'No syllabus provided.')}
"""

PREVIOUS PAPERS (for style/difficulty reference only — do not copy questions verbatim):
"""
${truncate(pastPapersText || 'No previous papers provided.')}
"""

Return ONLY valid JSON (no markdown fences, no commentary): an array of
exactly ${stagePattern.numQuestions} objects, numbered in order, shaped like:

{
  "number": 1,
  "question": "the full question text, written in the requested question type/style",
  "marks": ${stagePattern.marksPerQuestion || 10}
}`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const parsed = parseJsonResponse(result.response.text());
      if (Array.isArray(parsed)) {
        results[stage] = parsed.filter((q) => q.question);
      }
    } catch {
      results[stage] = [];
    }
  }

  return results;
}

/**
 * generateImportantTopics({ subject, syllabusText, pattern, pastPapersText })
 * -> Array<{ topic, importance: 'high'|'medium'|'low', summary, modelAnswer }>
 *
 * A revision-focused output, independent of any single stage: the topics
 * most worth studying across the whole subject, each with a short summary
 * and a model answer the student can actually study from.
 */
export async function generateImportantTopics({ subject, syllabusText, pattern, pastPapersText }) {
  const patternSummary = ['cat1', 'cat2', 'fat']
    .map((s) => {
      const p = pattern?.[s];
      if (!p || !p.numQuestions) return null;
      return `${s.toUpperCase()}: ${p.numQuestions} questions, ${p.marksPerQuestion || '?'} marks each, topics: ${p.topics || 'not specified'}`;
    })
    .filter(Boolean)
    .join('\n');

  const prompt = `You are helping a student prioritize revision for the subject
"${subject}" before their exams.

SYLLABUS:
"""
${truncate(syllabusText || 'No syllabus provided.')}
"""

EXAM PATTERN (entered by the student):
${patternSummary || 'Not specified.'}

PREVIOUS PAPERS TEXT (use to judge which topics recur and matter most):
"""
${truncate(pastPapersText || 'No previous papers provided.')}
"""

Identify the 8-12 most important topics to study, ranked by how likely they
are to matter for the exams. For each, write a short model answer a student
could actually study and reproduce.

Return ONLY valid JSON (no markdown fences, no commentary): an array of
objects shaped like:

{
  "topic": "short topic name",
  "importance": "high | medium | low",
  "summary": "one sentence on why this topic matters / how often it appears",
  "modelAnswer": "a concise, well-structured answer covering the core of this topic — a few sentences to a short paragraph"
}`;

  const result = await geminiModel.generateContent(prompt);
  const parsed = parseJsonResponse(result.response.text());

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini did not return a valid topics array.');
  }

  return parsed.filter((t) => t.topic && t.modelAnswer);
}
