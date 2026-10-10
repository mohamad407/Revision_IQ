import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import StudyTools from '../components/StudyTools';
import DocChat from '../components/DocChat';
import ListenButton from '../components/ListenButton';

const COUNTS = [5, 10, 15];
const LEVELS = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];
const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint';

function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className="inline-flex overflow-hidden rounded-sm border border-paper-line" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`px-4 py-2 text-sm transition-colors ${value === o.value ? 'bg-ink text-paper' : 'bg-paper-card text-ink hover:bg-paper'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const language = profile?.language || 'English';

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [makingCards, setMakingCards] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/documents/${id}`);
        if (!cancelled) setDoc(data?.data || null);
      } catch {
        if (!cancelled) setLoadError('Could not load this document.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleGenerateQuiz = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const { data } = await api.post('/quiz/generate', { documentId: id, count, difficulty });
      navigate('/quiz', { state: { quiz: data.data, documentName: doc?.fileName } });
    } catch (err) {
      setGenError(err?.response?.data?.message || 'Failed to generate quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const handleMakeFlashcards = async () => {
    setMakingCards(true);
    setGenError('');
    try {
      await api.post('/flashcards/generate', { documentId: id });
      navigate('/flashcards');
    } catch (err) {
      setGenError(err?.response?.data?.message || 'Failed to create flashcards.');
    } finally {
      setMakingCards(false);
    }
  };

  const handleRetrySummary = async () => {
    setRetrying(true);
    setGenError('');
    try {
      const { data } = await api.post(`/documents/${id}/summary`);
      setDoc((d) => ({ ...d, ...data.data }));
    } catch (err) {
      setGenError(err?.response?.data?.message || 'Could not regenerate the summary.');
    } finally {
      setRetrying(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    setGenError('');
    try {
      const { data } = await api.post('/flashcards/share', { documentId: id });
      setShareUrl(`${window.location.origin}/shared/${data.data.code}`);
    } catch (err) {
      setGenError(err?.response?.data?.message || 'Could not create a share link.');
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the link is selectable in the box */
    }
  };

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="h-4 w-32 animate-pulse rounded-sm bg-paper-line" />
        <div className="mt-6 h-9 w-2/3 animate-pulse rounded-sm bg-paper-line" />
        <div className="mt-8 h-52 animate-pulse rounded-sm bg-paper-line" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <p className="text-sm text-flag">{loadError || 'Document not found.'}</p>
        <Link to="/dashboard" className={`mt-4 inline-block hover:text-ink ${label}`}>
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const ready = doc.status === 'ready';
  const summaryText = doc.summary ? [doc.summary.headline, ...(doc.summary.keyPoints || [])].join('. ') : '';

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <Link to="/dashboard" className={`hover:text-ink ${label}`}>
        ← Back to dashboard
      </Link>

      <p className={`mt-6 ${label}`}>{doc.subject || 'Document'}</p>
      <h1 className="mt-2 break-words font-display text-3xl font-medium text-ink">{doc.fileName}</h1>
      {doc.pages ? <p className="mt-1 text-sm text-ink-faint">{doc.pages} pages</p> : null}
      {doc.ocr && (
        <p className="mt-3 rounded-sm bg-highlighter/10 px-3 py-2 text-xs text-highlighter-deep">
          Scanned PDF — read with AI vision (the first 12 pages). Text accuracy depends on scan quality.
        </p>
      )}

      {doc.status === 'processing' && (
        <p className="mt-6 rounded-sm bg-highlighter/10 px-4 py-3 text-sm text-highlighter-deep">Still processing — refresh in a moment.</p>
      )}
      {doc.status === 'failed' && (
        <p className="mt-6 rounded-sm bg-flag/10 px-4 py-3 text-sm text-flag">
          Something went wrong processing this document. Try uploading it again.
        </p>
      )}

      {doc.summary && (
        <div className="mt-8 rounded-sm border border-paper-line bg-paper-card p-6">
          <div className="flex items-center justify-between gap-3">
            <p className={label}>Summary</p>
            {doc.summary.keyPoints?.length > 0 && <ListenButton text={summaryText} language={language} />}
          </div>
          <h2 className="mt-2 font-display text-xl font-medium text-ink">{doc.summary.headline}</h2>
          {doc.summary.keyPoints?.length > 0 && (
            <ul className="mt-4 space-y-2">
              {doc.summary.keyPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-faint">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-highlighter-deep" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
          {!doc.summary.keyPoints?.length && (
            <button onClick={handleRetrySummary} disabled={retrying} className="btn-secondary mt-4 w-auto px-6">
              {retrying ? 'Retrying…' : 'Retry summary'}
            </button>
          )}
        </div>
      )}

      {genError && (
        <p className="mt-4 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
          {genError}
        </p>
      )}

      {ready && (
        <>
          <section className="mt-6 rounded-sm border border-paper-line bg-paper-card p-6">
            <p className={label}>Quiz</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <p className="mb-1 text-xs text-ink-faint">Questions</p>
                <Segmented
                  ariaLabel="Number of questions"
                  value={count}
                  onChange={setCount}
                  options={COUNTS.map((n) => ({ value: n, label: String(n) }))}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-ink-faint">Difficulty</p>
                <Segmented
                  ariaLabel="Difficulty"
                  value={difficulty}
                  onChange={setDifficulty}
                  options={LEVELS.map((l) => ({ value: l.key, label: l.label }))}
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={handleGenerateQuiz} className="btn-primary w-auto px-8" disabled={generating || makingCards}>
                {generating ? 'Generating quiz…' : 'Take the quiz'}
              </button>
              <button onClick={handleMakeFlashcards} className="btn-secondary w-auto px-8" disabled={generating || makingCards}>
                {makingCards ? 'Making flashcards…' : 'Make flashcards'}
              </button>
            </div>

            <div className="mt-5 border-t border-paper-line pt-4">
              {!shareUrl ? (
                <button onClick={handleShare} disabled={sharing} className={`hover:text-ink ${label}`}>
                  {sharing ? 'Creating link…' : '↗ Share my flashcards with a classmate'}
                </button>
              ) : (
                <div>
                  <p className="text-xs text-ink-faint">Anyone with this link can preview and copy your deck (valid for 90 days):</p>
                  <div className="mt-2 flex gap-2">
                    <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} className="field-line flex-1 text-sm" aria-label="Share link" />
                    <button onClick={copyLink} className="btn-secondary w-auto px-4 py-2">
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Revise with me on RevisionIQ: ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-2 inline-block hover:text-ink ${label}`}
                  >
                    Send on WhatsApp →
                  </a>
                </div>
              )}
            </div>
          </section>

          <StudyTools docId={id} />
          <DocChat docId={id} />
        </>
      )}
    </div>
  );
}
