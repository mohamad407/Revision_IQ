import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';

const STAGES = [
  { key: 'cat1', label: 'CAT-1' },
  { key: 'cat2', label: 'CAT-2' },
  { key: 'fat', label: 'FAT' },
];
const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint';
const BATCH = 20; // the server marks up to 20 answers per request

const fmt = (sec) => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export default function MockExamPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [phase, setPhase] = useState('setup'); // setup | exam | marking | result
  const [stage, setStage] = useState(null);
  const [minutes, setMinutes] = useState(60);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const endAt = useRef(0);
  const submitting = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/predictor/${id}`);
        setSession(data.data);
      } catch {
        setLoadError('Could not load this session.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const stages = useMemo(() => STAGES.filter((s) => session?.modelPaper?.[s.key]?.length > 0), [session]);
  const questions = useMemo(() => (stage ? session?.modelPaper?.[stage] || [] : []), [session, stage]);
  const totalMarks = questions.reduce((n, q) => n + (Number(q.marks) || 0), 0);

  const pickStage = (key) => {
    setStage(key);
    const marks = (session.modelPaper[key] || []).reduce((n, q) => n + (Number(q.marks) || 0), 0);
    setMinutes(Math.min(180, Math.max(10, Math.round(marks * 1.5))));
  };

  const submit = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    setPhase('marking');
    setError('');
    try {
      const items = questions.map((q, i) => ({
        question: q.question,
        answer: answers[i] || '',
        marks: Number(q.marks) || 1,
      }));
      const results = [];
      for (let i = 0; i < items.length; i += BATCH) {
        const { data } = await api.post(`/predictor/${id}/evaluate`, { answers: items.slice(i, i + BATCH) });
        results.push(...data.data.results);
      }
      const totalScore = results.reduce((n, r) => n + r.score, 0);
      const totalOf = results.reduce((n, r) => n + r.marks, 0);
      setResult({ results, totalScore, totalMarks: totalOf });
      setPhase('result');
    } catch (err) {
      // Keep the student's answers so nothing is lost; they can retry marking.
      setError(err?.response?.data?.message || 'Marking failed. Your answers are safe — try again.');
      setPhase('exam');
    } finally {
      submitting.current = false;
    }
  }, [answers, id, questions]);

  const start = () => {
    setAnswers({});
    setResult(null);
    setError('');
    endAt.current = Date.now() + minutes * 60 * 1000;
    setRemaining(minutes * 60);
    setPhase('exam');
  };

  // Countdown; auto-submits at zero.
  useEffect(() => {
    if (phase !== 'exam') return undefined;
    const t = setInterval(() => {
      const left = Math.round((endAt.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(t);
        submit();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase, submit]);

  // Warn before accidentally leaving mid-exam.
  useEffect(() => {
    if (phase !== 'exam') return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-12"><div className="h-48 animate-pulse rounded-sm bg-paper-line" /></div>;
  if (!session) return <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-flag">{loadError}</div>;

  const pct = result && result.totalMarks ? Math.round((result.totalScore / result.totalMarks) * 100) : 0;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      {phase !== 'exam' && phase !== 'marking' && (
        <Link to={`/predictor/${id}`} className={`hover:text-ink ${label}`}>← Back to session</Link>
      )}
      <p className={`mt-6 ${label}`}>Mock exam · {session.subject}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">Timed practice paper</h1>

      {phase === 'setup' && (
        <div className="mt-6 rounded-sm border border-paper-line bg-paper-card p-6">
          {stages.length === 0 ? (
            <p className="text-sm text-ink-faint">
              Generate a model paper first (in your predictor session), then come back to sit it as a timed exam.
            </p>
          ) : (
            <>
              <p className={label}>1. Choose the paper</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stages.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => pickStage(s.key)}
                    className={`rounded-sm border px-4 py-2 text-sm ${stage === s.key ? 'border-ink bg-ink text-paper' : 'border-paper-line text-ink hover:border-ink'}`}
                  >
                    {s.label} · {session.modelPaper[s.key].length} questions
                  </button>
                ))}
              </div>

              {stage && (
                <>
                  <p className={`mt-6 ${label}`}>2. Set the time</p>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={minutes}
                      onChange={(e) => setMinutes(Math.min(240, Math.max(5, Number(e.target.value) || 5)))}
                      className="field-line w-24"
                      aria-label="Minutes"
                    />
                    <span className="text-sm text-ink-faint">minutes for {totalMarks} marks</span>
                  </div>
                  <ul className="mt-5 list-disc space-y-1 pl-5 text-xs text-ink-faint">
                    <li>Write your answers like in a real exam. The paper is marked by AI when time ends or you submit.</li>
                    <li>Keep this tab open: leaving the page loses your answers.</li>
                  </ul>
                  <button onClick={start} className="btn-primary mt-6 w-auto px-8">Start exam</button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {(phase === 'exam' || phase === 'marking') && (
        <>
          <div className="sticky top-0 z-10 -mx-4 mt-4 flex items-center justify-between border-b border-paper-line bg-paper px-4 py-3 sm:-mx-6 sm:px-6">
            <p className="font-mono text-sm text-ink" aria-live="off">
              <span className={remaining <= 300 ? 'text-flag' : ''}>{fmt(remaining)}</span> left
            </p>
            <button onClick={submit} disabled={phase === 'marking'} className="btn-primary w-auto px-6 py-2">
              {phase === 'marking' ? 'Marking…' : 'Submit paper'}
            </button>
          </div>

          {error && <p className="mt-4 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">{error}</p>}

          <div className="mt-6 space-y-6">
            {questions.map((q, i) => (
              <div key={i} className="rounded-sm border border-paper-line bg-paper-card p-4">
                <p className="font-display text-sm text-ink">{q.number}. {q.question}</p>
                <p className="mt-1 text-xs text-ink-faint">[{q.marks} marks]</p>
                <textarea
                  className="mt-3 w-full rounded-sm border border-paper-line bg-paper p-3 text-sm text-ink focus:border-highlighter-deep focus:outline-none"
                  rows={6}
                  maxLength={4000}
                  disabled={phase === 'marking'}
                  value={answers[i] || ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                  aria-label={`Answer to question ${q.number}`}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'result' && result && (
        <>
          <div className="mt-6 rounded-sm border border-paper-line bg-paper-card p-6 text-center">
            <p className={label}>Your score</p>
            <p className={`mt-2 font-display text-5xl font-medium ${pct >= 60 ? 'text-correct' : pct >= 35 ? 'text-highlighter-deep' : 'text-flag'}`}>
              {result.totalScore} / {result.totalMarks}
            </p>
            <p className="mt-1 text-sm text-ink-faint">{pct}%</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button onClick={() => { setPhase('setup'); setResult(null); }} className="btn-primary w-auto px-6">Sit another paper</button>
              <Link to={`/predictor/${id}`} className="btn-secondary w-auto px-6">Back to session</Link>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {questions.map((q, i) => {
              const r = result.results[i];
              return (
                <div key={i} className="rounded-sm border border-paper-line bg-paper-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-sm text-ink">{q.number}. {q.question}</p>
                    <span className="flex-shrink-0 font-mono text-xs text-ink">{r.score}/{r.marks}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{r.feedback}</p>
                  {r.missing?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.missing.map((m, j) => (
                        <span key={j} className="rounded-full bg-flag/10 px-2.5 py-1 text-xs text-flag">Missing: {m}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
