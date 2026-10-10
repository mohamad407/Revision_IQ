import { useState } from 'react';
import api from '../lib/api';

// "Write your answer" box under a predicted question. The AI examiner marks it and
// says what was missing.
export default function AnswerChecker({ predictorId, question, marks = 10 }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const check = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/predictor/${predictorId}/evaluate`, {
        answers: [{ question, answer, marks }],
      });
      setResult(data.data.results[0]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not check your answer. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink">
        ✎ Practise this question
      </button>
    );
  }

  const pct = result ? Math.round((result.score / result.marks) * 100) : 0;

  return (
    <div className="mt-3 border-t border-paper-line pt-3">
      <textarea
        className="w-full rounded-sm border border-paper-line bg-paper p-3 text-sm text-ink focus:border-highlighter-deep focus:outline-none"
        rows={5}
        maxLength={4000}
        placeholder={`Write your answer here (worth ${marks} marks)…`}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        aria-label="Your answer"
      />
      <div className="mt-2 flex items-center gap-4">
        <button onClick={check} disabled={busy || answer.trim().length < 3} className="btn-primary w-auto px-5 py-2">
          {busy ? 'Marking…' : 'Check my answer'}
        </button>
        <button onClick={() => setOpen(false)} className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink">
          Close
        </button>
      </div>
      {error && <p className="mt-2 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">{error}</p>}
      {result && (
        <div className="mt-3 rounded-sm bg-paper p-3">
          <p className={`font-display text-lg font-medium ${pct >= 60 ? 'text-correct' : pct >= 35 ? 'text-highlighter-deep' : 'text-flag'}`}>
            {result.score} / {result.marks} marks
          </p>
          <p className="mt-1 text-sm text-ink-soft">{result.feedback}</p>
          {result.missing?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.missing.map((m, i) => (
                <span key={i} className="rounded-full bg-flag/10 px-2.5 py-1 text-xs text-flag">Missing: {m}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
