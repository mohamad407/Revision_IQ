import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const RATINGS = [
  { value: 0, label: 'Again', hint: 'in 10 min', style: 'border-flag text-flag hover:bg-flag/10' },
  { value: 1, label: 'Hard', hint: 'soon', style: 'border-highlighter-deep text-highlighter-deep hover:bg-highlighter/15' },
  { value: 2, label: 'Good', hint: 'later', style: 'border-correct text-correct hover:bg-correct/10' },
  { value: 3, label: 'Easy', hint: 'much later', style: 'border-ink text-ink hover:bg-ink/5' },
];

export default function FlashcardsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState([]);
  const [initial, setInitial] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/flashcards/due', { params: { limit: 30 } });
      const cards = data?.data?.cards || [];
      setQueue(cards);
      setInitial(cards.length);
      setReviewed(0);
      setTotalCount(data?.data?.totalCount || 0);
      setFlipped(false);
    } catch {
      setError('Could not load your flashcards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = queue[0];

  const rate = useCallback(
    async (rating) => {
      if (!current || busy) return;
      setBusy(true);
      try {
        await api.post(`/flashcards/${current._id}/review`, { rating });
        setQueue((q) => {
          const [first, ...rest] = q;
          // "Again" cards come back at the end of this session.
          return rating === 0 ? [...rest, first] : rest;
        });
        if (rating !== 0) setReviewed((n) => n + 1);
        setFlipped(false);
      } catch {
        setError('Could not save that review. Check your connection and try again.');
      } finally {
        setBusy(false);
      }
    },
    [current, busy]
  );

  // Keyboard: Space/Enter flips, 1-4 rates.
  useEffect(() => {
    const onKey = (e) => {
      if (!current) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        rate(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, flipped, rate]);

  const progress = initial ? Math.round((reviewed / initial) * 100) : 0;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        to="/dashboard"
        className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
      >
        ← Back to dashboard
      </Link>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        Flashcards · spaced repetition
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">Today&apos;s review</h1>

      {error && (
        <p className="mt-4 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 h-64 animate-pulse rounded-sm bg-paper-line" />
      ) : totalCount === 0 ? (
        <div className="mt-8 rounded-sm border border-dashed border-paper-line px-6 py-12 text-center">
          <p className="font-display text-lg text-ink">No flashcards yet</p>
          <p className="mt-2 text-sm text-ink-faint">
            Open any ready document and choose &ldquo;Make flashcards&rdquo; — the AI builds a deck from it.
          </p>
          <Link to="/dashboard" className="btn-primary mt-6 inline-block w-auto px-8">
            Go to my documents
          </Link>
        </div>
      ) : !current ? (
        <div className="mt-8 rounded-sm border border-paper-line bg-paper-card px-6 py-12 text-center">
          <p className="font-display text-2xl text-ink">
            {reviewed > 0 ? 'Nice work — session complete.' : 'You\u2019re all caught up.'}
          </p>
          <p className="mt-2 text-sm text-ink-faint">
            {reviewed > 0
              ? `You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'}. They'll come back right when you're about to forget them.`
              : `Nothing is due right now. You have ${totalCount} card${totalCount === 1 ? '' : 's'} scheduled for later.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/dashboard" className="btn-primary w-auto px-8">Back to dashboard</Link>
            <button onClick={load} className="btn-secondary w-auto px-8">Check again</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-paper-line" aria-hidden="true">
            <div className="h-full bg-highlighter-deep transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint" aria-live="polite">
            {reviewed} / {initial} reviewed · {queue.length} left
          </p>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="mt-4 flex min-h-[260px] w-full flex-col items-center justify-center rounded-sm border border-paper-line bg-paper-card px-6 py-8 text-center transition-colors hover:border-ink"
            aria-label={flipped ? 'Hide answer' : 'Show answer'}
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              {flipped ? 'Answer' : 'Question'}
              {current.document?.fileName || current.deckName ? ` · ${current.document?.fileName || current.deckName}` : ''}
            </span>
            <span className="mt-4 whitespace-pre-line font-display text-xl text-ink sm:text-2xl">
              {flipped ? current.back : current.front}
            </span>
            {!flipped && (
              <span className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                Tap or press space to flip
              </span>
            )}
          </button>

          {flipped ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => rate(r.value)}
                  disabled={busy}
                  className={`rounded-sm border px-3 py-3 text-center transition-colors disabled:opacity-50 ${r.style}`}
                >
                  <span className="block font-display text-base font-medium">{r.label}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-widest opacity-70">
                    {r.hint} · {r.value + 1}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-center text-xs text-ink-faint">
              Try to recall the answer first, then flip the card and rate how well you knew it.
            </p>
          )}
        </>
      )}
    </div>
  );
}
