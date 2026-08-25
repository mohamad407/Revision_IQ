import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

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
      const { data } = await api.post('/quiz/generate', { documentId: id });
      navigate('/quiz', { state: { quiz: data.data, documentName: doc?.fileName } });
    } catch (err) {
      setGenError(err?.response?.data?.message || 'Failed to generate quiz.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-6 py-12">
        <div className="h-4 w-32 animate-pulse rounded-sm bg-paper-line" />
        <div className="mt-6 h-9 w-2/3 animate-pulse rounded-sm bg-paper-line" />
        <div className="mt-8 h-52 animate-pulse rounded-sm bg-paper-line" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-6 py-12">
        <p className="text-sm text-flag">{loadError || 'Document not found.'}</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <Link
        to="/dashboard"
        className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
      >
        ← Back to dashboard
      </Link>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        {doc.subject || 'Document'}
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">{doc.fileName}</h1>
      {doc.pages ? <p className="mt-1 text-sm text-ink-faint">{doc.pages} pages</p> : null}

      {doc.status === 'processing' && (
        <p className="mt-6 rounded-sm bg-highlighter/10 px-4 py-3 text-sm text-highlighter-deep">
          Still processing — refresh in a moment.
        </p>
      )}
      {doc.status === 'failed' && (
        <p className="mt-6 rounded-sm bg-flag/10 px-4 py-3 text-sm text-flag">
          Something went wrong processing this document. Try uploading it again.
        </p>
      )}

      {doc.summary && (
        <div className="mt-8 rounded-sm border border-paper-line bg-paper-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Summary</p>
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
        </div>
      )}

      {genError && (
        <p className="mt-4 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
          {genError}
        </p>
      )}

      {doc.status === 'ready' && (
        <button
          onClick={handleGenerateQuiz}
          className="btn-primary mt-6 w-auto px-8"
          disabled={generating}
        >
          {generating ? 'Generating quiz…' : 'Take the quiz'}
        </button>
      )}
    </div>
  );
}
