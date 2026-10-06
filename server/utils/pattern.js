// The student-entered exam pattern goes straight into AI prompts, so it is
// rebuilt field-by-field with strict types and length caps. Unknown keys are
// dropped (no mass assignment) and numbers are clamped (no huge-prompt DoS).
const STAGES = ['cat1', 'cat2', 'fat'];
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number.isFinite(+v) ? Math.floor(+v) : 0));
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const LIMITS = { maxQuestions: 30, maxMarks: 100, maxSyllabusChars: 30000 };

export function sanitizePattern(pattern) {
  const out = {};
  for (const stage of STAGES) {
    const p = pattern?.[stage];
    if (!p || typeof p !== 'object') continue;
    out[stage] = {
      numQuestions: clamp(p.numQuestions, 0, LIMITS.maxQuestions),
      marksPerQuestion: clamp(p.marksPerQuestion, 0, LIMITS.maxMarks),
      questionType: str(p.questionType, 100),
      topics: str(p.topics, 1000),
      notes: str(p.notes, 1000),
    };
  }
  return out;
}
