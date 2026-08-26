import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';

const STAGES = [
  { key: 'cat1', label: 'CAT-1' },
  { key: 'cat2', label: 'CAT-2' },
  { key: 'fat', label: 'FAT' },
];

const LIKELIHOOD_STYLES = {
  high: 'text-flag bg-flag/10',
  medium: 'text-highlighter-deep bg-highlighter/15',
  low: 'text-ink-faint bg-paper-line',
};

const emptyStage = () => ({ numQuestions: '', marksPerQuestion: '', questionType: '', topics: '', notes: '' });

export default function PredictorDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [pattern, setPattern] = useState({ cat1: emptyStage(), cat2: emptyStage(), fat: emptyStage() });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [paperFile, setPaperFile] = useState(null);
  const [paperStage, setPaperStage] = useState('unspecified');
  const [uploadingPaper, setUploadingPaper] = useState(false);
  const [paperError, setPaperError] = useState('');

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/predictor/${id}`);
      const s = data?.data;
      setSession(s);
      if (s) {
        setSubject(s.subject || '');
        setSyllabusText(s.syllabusText || '');
        setPattern({
          cat1: { ...emptyStage(), ...s.pattern?.cat1 },
          cat2: { ...emptyStage(), ...s.pattern?.cat2 },
          fat: { ...emptyStage(), ...s.pattern?.fat },
        });
      }
    } catch (err) {
      console.error('Failed to fetch predictor session:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const updateStageField = (stage, field, value) => {
    setPattern((p) => ({ ...p, [stage]: { ...p[stage], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const normalizedPattern = Object.fromEntries(
        STAGES.map(({ key }) => [
          key,
          {
            ...pattern[key],
            numQuestions: Number(pattern[key].numQuestions) || 0,
            marksPerQuestion: Number(pattern[key].marksPerQuestion) || 0,
          },
        ])
      );
      await api.put(`/predictor/${id}`, { subject, syllabusText, pattern: normalizedPattern });
      setSaveMsg('Saved.');
      await fetchSession();
    } catch (err) {
      setSaveMsg(err?.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPaper = async (e) => {
    e.preventDefault();
    if (!paperFile) {
      setPaperError('Choose a PDF first.');
      return;
    }
    setUploadingPaper(true);
    setPaperError('');
    try {
      const formData = new FormData();
      formData.append('file', paperFile);
      formData.append('stage', paperStage);
      await api.post(`/predictor/${id}/papers`, formData);
      setPaperFile(null);
      await fetchSession();
    } catch (err) {
      setPaperError(err?.response?.data?.message || 'Failed to upload past paper.');
    } finally {
      setUploadingPaper(false);
    }
  };

  const handleDeletePaper = async (paperId) => {
    try {
      await api.delete(`/predictor/${id}/papers/${paperId}`);
      await fetchSession();
    } catch (err) {
      console.error('Failed to delete past paper:', err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const { data } = await api.post(`/predictor/${id}/generate`);
      setSession(data.data);
    } catch (err) {
      setGenError(err?.response?.data?.message || 'Failed to generate predictions.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-6 py-12">
        <div className="h-4 w-32 animate-pulse rounded-sm bg-paper-line" />
        <div className="mt-6 h-9 w-2/3 animate-pulse rounded-sm bg-paper-line" />
        <div className="mt-8 h-64 animate-pulse rounded-sm bg-paper-line" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-6 py-12">
        <p className="text-sm text-flag">Session not found.</p>
        <Link to="/predictor" className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink">
          ← Back to predictor
        </Link>
      </div>
    );
  }

  const hasAnyPattern = STAGES.some(({ key }) => Number(pattern[key].numQuestions) > 0);
  const hasPredictions = STAGES.some(({ key }) => session.predictions?.[key]?.length > 0);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <Link to="/predictor" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink">
        ← Back to predictor
      </Link>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Question predictor</p>
      <input
        className="mt-2 w-full bg-transparent font-display text-3xl font-medium text-ink outline-none"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject name"
      />

      {/* Syllabus */}
      <div className="mt-8 rounded-sm border border-paper-line bg-paper-card p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Syllabus</p>
        <textarea
          className="field-line mt-3 min-h-[100px] resize-y"
          placeholder="Paste your syllabus / module breakdown here…"
          value={syllabusText}
          onChange={(e) => setSyllabusText(e.target.value)}
        />
      </div>

      {/* Pattern per stage */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STAGES.map(({ key, label }) => (
          <div key={key} className="rounded-sm border border-paper-line bg-paper-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label} pattern</p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="field-label"># Questions</label>
                <input
                  type="number"
                  min="0"
                  className="field-line"
                  value={pattern[key].numQuestions}
                  onChange={(e) => updateStageField(key, 'numQuestions', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Marks each</label>
                <input
                  type="number"
                  min="0"
                  className="field-line"
                  value={pattern[key].marksPerQuestion}
                  onChange={(e) => updateStageField(key, 'marksPerQuestion', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Question type</label>
                <input
                  type="text"
                  className="field-line"
                  placeholder="e.g. Essay, MCQ"
                  value={pattern[key].questionType}
                  onChange={(e) => updateStageField(key, 'questionType', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Topics / modules</label>
                <input
                  type="text"
                  className="field-line"
                  placeholder="e.g. Modules 1-2"
                  value={pattern[key].topics}
                  onChange={(e) => updateStageField(key, 'topics', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={handleSave} className="btn-primary w-auto px-8" disabled={saving}>
          {saving ? 'Saving…' : 'Save syllabus & pattern'}
        </button>
        {saveMsg && <p className="text-sm text-ink-faint">{saveMsg}</p>}
      </div>

      {/* Past papers */}
      <div className="mt-10 rounded-sm border border-paper-line bg-paper-card p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Previous papers ({session.pastPapers?.length || 0})
        </p>

        {session.pastPapers?.length > 0 && (
          <ul className="mt-3 space-y-2">
            {session.pastPapers.map((p) => (
              <li key={p._id} className="flex items-center justify-between rounded-sm border border-paper-line px-3 py-2 text-sm">
                <span>{p.fileName} <span className="text-ink-faint">· {p.stage}</span></span>
                <button onClick={() => handleDeletePaper(p._id)} className="text-xs text-flag hover:underline">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleUploadPaper} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="field-label">PDF file</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPaperFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-ink-faint file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-paper"
            />
          </div>
          <div>
            <label className="field-label">Stage</label>
            <select
              className="field-line"
              value={paperStage}
              onChange={(e) => setPaperStage(e.target.value)}
            >
              <option value="unspecified">Unspecified</option>
              <option value="cat1">CAT-1</option>
              <option value="cat2">CAT-2</option>
              <option value="fat">FAT</option>
            </select>
          </div>
          <button type="submit" className="btn-secondary w-auto px-6" disabled={uploadingPaper}>
            {uploadingPaper ? 'Uploading…' : 'Upload paper'}
          </button>
        </form>
        {paperError && <p className="mt-2 text-sm text-flag">{paperError}</p>}
      </div>

      {/* Generate */}
      {genError && (
        <p className="mt-4 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
          {genError}
        </p>
      )}
      <button
        onClick={handleGenerate}
        className="btn-primary mt-6 w-auto px-8"
        disabled={!hasAnyPattern || generating}
        title={!hasAnyPattern ? 'Set a pattern for at least one stage first' : ''}
      >
        {generating ? 'Predicting…' : 'Predict questions'}
      </button>

      {/* Predictions */}
      {hasPredictions && (
        <div className="mt-10 space-y-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Predictions</p>
          {STAGES.map(({ key, label }) => {
            const questions = session.predictions?.[key] || [];
            if (questions.length === 0) return null;
            return (
              <div key={key}>
                <h2 className="font-display text-xl font-medium text-ink">{label}</h2>
                <div className="mt-3 space-y-3">
                  {questions.map((q, i) => (
                    <div key={i} className="rounded-sm border border-paper-line bg-paper-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-display text-sm font-medium text-ink">{q.question}</p>
                        <span
                          className={`flex-shrink-0 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest ${
                            LIKELIHOOD_STYLES[q.likelihood] || ''
                          }`}
                        >
                          {q.likelihood}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-ink-faint">Topic: {q.topic}</p>
                      {q.reasoning && <p className="mt-1 text-xs text-ink-faint">{q.reasoning}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
