import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const STATUS_STYLES = {
  processing: 'text-highlighter-deep bg-highlighter/15',
  ready: 'text-correct bg-correct/10',
  failed: 'text-flag bg-flag/10',
};

export default function DashboardPage() {
  const { firebaseUser, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const { data } = await api.get('/documents');
      setDocuments(data?.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFile = (selected) => {
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported.');
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20MB.');
      return;
    }
    setUploadError('');
    setFile(selected);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Choose a PDF first.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (subject.trim()) formData.append('subject', subject.trim());

      // Backend extracts text + generates the AI summary synchronously
      // during this request, so the document already comes back "ready".
      await api.post('/documents/upload', formData);

      setFile(null);
      setSubject('');
      await fetchDocuments();
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-paper-line px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-highlighter font-display text-sm font-semibold text-ink">
            R
          </span>
          <span className="font-display text-base font-medium tracking-tight">RevisionIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
          >
            {firebaseUser?.email}
          </Link>
          <button
            onClick={logout}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-flag"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Your workspace
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-ink">
          Welcome back{firebaseUser?.displayName ? `, ${firebaseUser.displayName.split(' ')[0]}` : ''}.
        </h1>

        {/* Upload */}
        <form
          onSubmit={handleUpload}
          className="mt-8 rounded-sm border border-paper-line bg-paper-card p-6"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Upload a lecture
          </p>

          <label
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragActive ? 'border-highlighter-deep bg-highlighter/10' : 'border-paper-line'
            }`}
          >
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {file ? (
              <>
                <p className="font-display text-lg text-ink">{file.name}</p>
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                  {(file.size / 1024 / 1024).toFixed(1)} MB — click to change
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-lg text-ink">Drop a PDF here</p>
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                  or click to browse — max 20MB
                </p>
              </>
            )}
          </label>

          <div className="mt-4">
            <label htmlFor="subject" className="field-label">Subject (optional)</label>
            <input
              id="subject"
              type="text"
              className="field-line"
              placeholder="e.g. Organic Chemistry"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {uploadError && (
            <p className="mt-3 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
              {uploadError}
            </p>
          )}

          <button type="submit" className="btn-primary mt-5 w-auto px-8" disabled={uploading}>
            {uploading ? 'Processing… this can take a moment' : 'Upload & summarize'}
          </button>
        </form>

        {/* Document list */}
        <div className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Your documents
          </p>

          {loadingDocs ? (
            <div className="mt-3 space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-sm bg-paper-line" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <p className="mt-3 text-sm text-ink-faint">
              No documents yet — upload your first lecture above.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {documents.map((doc) => (
                <li key={doc._id}>
                  <Link
                    to={`/documents/${doc._id}`}
                    className="flex items-center justify-between rounded-sm border border-paper-line bg-paper-card px-5 py-4 transition-colors hover:border-ink"
                  >
                    <div>
                      <p className="font-display text-base font-medium text-ink">{doc.fileName}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {doc.subject || 'No subject'} · {doc.pages ? `${doc.pages} pages` : '—'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
                        STATUS_STYLES[doc.status] || ''
                      }`}
                    >
                      {doc.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Question predictor */}
        <div className="mt-10">
          <Link
            to="/predictor"
            className="flex items-center justify-between rounded-sm border border-paper-line bg-ink px-6 py-5 text-paper transition-colors hover:bg-ink-soft"
          >
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-highlighter">
                New
              </p>
              <p className="mt-1 font-display text-lg font-medium">Question predictor</p>
              <p className="mt-1 text-sm text-paper/70">
                Enter your syllabus and CAT-1 / CAT-2 / FAT pattern, upload past papers, get AI-predicted questions.
              </p>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">→</span>
          </Link>
        </div>

        {/* Coming soon */}
        <div className="mt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Coming soon
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {['Flashcards', 'Full analytics'].map((label) => (
              <div
                key={label}
                className="rounded-sm border border-dashed border-paper-line px-4 py-6 text-center opacity-60"
              >
                <p className="font-display text-sm font-medium text-ink">{label}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  Coming soon
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
