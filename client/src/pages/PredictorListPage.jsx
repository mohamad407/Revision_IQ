import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const STATUS_STYLES = {
  draft: 'text-ink-faint bg-paper-line',
  predicting: 'text-highlighter-deep bg-highlighter/15',
  ready: 'text-correct bg-correct/10',
  failed: 'text-flag bg-flag/10',
};

export default function PredictorListPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/predictor');
      setSessions(data?.data || []);
    } catch (err) {
      console.error('Failed to fetch predictor sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Enter a subject name.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      await api.post('/predictor', { subject: subject.trim() });
      setSubject('');
      await fetchSessions();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create session.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-paper-line px-6 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-highlighter font-display text-sm font-semibold text-ink">
            R
          </span>
          <span className="font-display text-base font-medium tracking-tight">RevisionIQ</span>
        </Link>
        <Link
          to="/dashboard"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
        >
          ← Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Question predictor
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-ink">
          Predict likely questions
        </h1>
        <p className="mt-2 text-sm text-ink-faint">
          Enter your syllabus and exam pattern for CAT-1, CAT-2, and FAT, upload
          previous papers you have, and the AI predicts likely questions per stage.
        </p>

        <form
          onSubmit={handleCreate}
          className="mt-8 flex items-end gap-3 rounded-sm border border-paper-line bg-paper-card p-5"
        >
          <div className="flex-1">
            <label htmlFor="subject" className="field-label">New subject</label>
            <input
              id="subject"
              type="text"
              className="field-line"
              placeholder="e.g. Data Structures and Algorithms"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-auto px-6" disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
        {error && (
          <p className="mt-2 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
            {error}
          </p>
        )}

        <div className="mt-10">
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-sm bg-paper-line" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-ink-faint">No subjects yet — create one above.</p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li key={s._id}>
                  <Link
                    to={`/predictor/${s._id}`}
                    className="flex items-center justify-between rounded-sm border border-paper-line bg-paper-card px-5 py-4 transition-colors hover:border-ink"
                  >
                    <div>
                      <p className="font-display text-base font-medium text-ink">{s.subject}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {s.pastPapers?.length || 0} past paper(s) uploaded
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
                        STATUS_STYLES[s.status] || ''
                      }`}
                    >
                      {s.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
