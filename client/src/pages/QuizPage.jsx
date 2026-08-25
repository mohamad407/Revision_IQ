import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../lib/api';

// Reached only via navigate('/quiz', { state: { quiz, documentName } }) from
// DocumentDetailPage — there's no GET-by-id quiz route in the demo scope,
// so the quiz payload travels through router state instead of a refetch.
export default function QuizPage() {
  const location = useLocation();
  const quiz = location.state?.quiz;
  const documentName = location.state?.documentName;

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!quiz) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-faint">
          No quiz loaded. Generate one from a document first.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const handleSelect = (index, option) => {
    setAnswers((a) => ({ ...a, [index]: option }));
  };

  const allAnswered = quiz.questions.every((_, i) => answers[i]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        quizId: quiz._id,
        answers: quiz.questions.map((_, i) => ({
          questionIndex: i,
          selected: answers[i] || '',
        })),
      };
      const { data } = await api.post('/quiz/submit', payload);
      setResult(data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Quiz complete
        </p>
        <p className="mt-3 font-display text-6xl font-semibold text-ink">
          {result.score}
          <span className="text-2xl text-ink-faint">/{result.total}</span>
        </p>
        <p className="mt-2 text-sm text-ink-faint">{documentName}</p>

        <div className="mt-10 space-y-4 text-left">
          {quiz.questions.map((q, i) => {
            const graded = result.answers[i];
            return (
              <div key={i} className="rounded-sm border border-paper-line bg-paper-card p-4">
                <p className="font-display text-sm font-medium text-ink">{q.question}</p>
                <p className={`mt-2 text-xs ${graded.correct ? 'text-correct' : 'text-flag'}`}>
                  Your answer: {graded.selected || '—'}{' '}
                  {graded.correct ? '✓' : `✗ (correct: ${result.correctAnswers[i]})`}
                </p>
              </div>
            );
          })}
        </div>

        <Link to="/dashboard" className="btn-primary mt-10 inline-flex w-auto px-8">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link
        to="/dashboard"
        className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
      >
        ← Back to dashboard
      </Link>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        Quiz · {documentName}
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">Test yourself</h1>

      <div className="mt-8 space-y-6">
        {quiz.questions.map((q, i) => (
          <div key={i} className="rounded-sm border border-paper-line bg-paper-card p-5">
            <p className="font-display text-base font-medium text-ink">
              {i + 1}. {q.question}
            </p>
            <div className="mt-4 space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-2.5 text-sm transition-colors ${
                    answers[i] === opt
                      ? 'border-ink bg-ink text-paper'
                      : 'border-paper-line text-ink hover:border-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${i}`}
                    className="sr-only"
                    checked={answers[i] === opt}
                    onChange={() => handleSelect(i, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        className="btn-primary mt-6 w-auto px-8"
        disabled={!allAnswered || submitting}
      >
        {submitting ? 'Submitting…' : 'Submit quiz'}
      </button>
    </div>
  );
}
