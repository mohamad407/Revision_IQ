import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

// Public page opened from a share link. Anyone can preview; adding needs an account.
export default function SharedDeckPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { firebaseUser, loading: authLoading } = useAuth();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [flip, setFlip] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/shared/${code}`);
        if (!cancelled) setDeck(data.data);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'This shared deck could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const add = async () => {
    setAdding(true);
    setError('');
    try {
      await api.post('/flashcards/import', { code });
      navigate('/flashcards');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not add this deck.');
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Shared flashcards</p>

      {loading && <div className="mt-6 h-48 animate-pulse rounded-sm bg-paper-line" />}

      {!loading && !deck && (
        <div className="mt-6 rounded-sm border border-dashed border-paper-line px-6 py-10 text-center">
          <p className="font-display text-lg text-ink">{error}</p>
          <Link to="/" className="btn-primary mt-6 inline-block w-auto px-8">Go to RevisionIQ</Link>
        </div>
      )}

      {deck && (
        <>
          <h1 className="mt-2 break-words font-display text-3xl font-medium text-ink">{deck.title}</h1>
          <p className="mt-1 text-sm text-ink-faint">{deck.count} cards — a classmate shared this deck with you.</p>

          <div className="mt-6 space-y-3">
            {deck.preview.map((c, i) => (
              <button
                key={i}
                onClick={() => setFlip((f) => ({ ...f, [i]: !f[i] }))}
                className="block w-full rounded-sm border border-paper-line bg-paper-card p-4 text-left hover:border-ink"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">{flip[i] ? 'Answer' : 'Question'} · tap to flip</span>
                <span className="mt-1 block font-display text-base text-ink">{flip[i] ? c.back : c.front}</span>
              </button>
            ))}
            {deck.count > deck.preview.length && (
              <p className="text-center text-xs text-ink-faint">…and {deck.count - deck.preview.length} more cards after you add the deck.</p>
            )}
          </div>

          {error && <p className="mt-4 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">{error}</p>}

          <div className="mt-6">
            {authLoading ? null : firebaseUser ? (
              <button onClick={add} disabled={adding} className="btn-primary w-auto px-8">
                {adding ? 'Adding…' : 'Add to my flashcards'}
              </button>
            ) : (
              <div className="rounded-sm border border-paper-line bg-paper-card p-4">
                <p className="text-sm text-ink">Create a free account to study this deck with spaced repetition.</p>
                <div className="mt-3 flex gap-3">
                  <Link to="/signup" className="btn-primary w-auto px-6">Sign up</Link>
                  <Link to="/login" className="btn-secondary w-auto px-6">Log in</Link>
                </div>
                <p className="mt-3 text-xs text-ink-faint">After logging in, open this link again to add the deck.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
