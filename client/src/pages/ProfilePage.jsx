import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import api from '../lib/api';

const emptyAcademicFields = { university: '', department: '', semester: '', language: 'English', dailyGoal: '10' };
const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam'];

export default function ProfilePage() {
  const { firebaseUser, profile, setProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState('');
  const [feedbackState, setFeedbackState] = useState(null); // 'sent' | string error | null
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [fields, setFields] = useState(emptyAcademicFields);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    if (profile) {
      setFields({
        university: profile.university || '',
        department: profile.department || '',
        semester: profile.semester || '',
        language: profile.language || 'English',
        dailyGoal: String(profile.dailyGoal || 10),
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveState(null);
    try {
      const { data } = await api.put('/user/profile', fields);
      setProfile(data?.data ?? { ...profile, ...fields });
      setSaveState('success');
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  };

  const sendFeedback = async (e) => {
    e.preventDefault();
    setSendingFeedback(true);
    setFeedbackState(null);
    try {
      await api.post('/feedback', { message: feedback, page: 'profile' });
      setFeedback('');
      setFeedbackState('sent');
    } catch (err) {
      setFeedbackState(err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || 'Could not send feedback.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete('/user/me');
      try {
        await logout();
      } catch {
        /* the Firebase user is already deleted server-side */
      }
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  if (!firebaseUser) return null;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        Your account
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">Profile</h1>

      <div className="mt-8 flex items-center gap-4 rounded-sm border border-paper-line bg-paper-card p-6">
        {firebaseUser.photoURL ? (
          <img
            src={firebaseUser.photoURL}
            alt=""
            className="h-16 w-16 rounded-full border border-paper-line object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink font-display text-xl text-paper">
            {(firebaseUser.displayName || firebaseUser.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-display text-lg font-medium text-ink">
            {firebaseUser.displayName || 'Unnamed student'}
          </p>
          <p className="text-sm text-ink-faint">{firebaseUser.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-5 rounded-sm border border-paper-line bg-paper-card p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Academic details
        </p>

        <FormField
          id="university"
          name="university"
          label="University"
          placeholder="e.g. VIT Vellore"
          value={fields.university}
          onChange={handleChange}
        />
        <FormField
          id="department"
          name="department"
          label="Department"
          placeholder="e.g. Computer Science"
          value={fields.department}
          onChange={handleChange}
        />
        <div>
          <label htmlFor="language" className="field-label">AI language</label>
          <select id="language" name="language" value={fields.language} onChange={handleChange} className="field-line bg-paper-card">
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-faint">Summaries, quizzes, flashcards and study tools are written in this language.</p>
        </div>
        <div>
          <label htmlFor="dailyGoal" className="field-label">Daily flashcard goal</label>
          <input id="dailyGoal" name="dailyGoal" type="number" min={1} max={200} value={fields.dailyGoal} onChange={handleChange} className="field-line" />
        </div>
        <FormField
          id="semester"
          name="semester"
          label="Semester"
          placeholder="e.g. 5"
          value={fields.semester}
          onChange={handleChange}
        />

        {saveState === 'success' && (
          <p className="rounded-sm bg-correct/10 px-3 py-2 text-sm text-correct">
            Profile saved.
          </p>
        )}
        {saveState === 'error' && (
          <p className="rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag">
            Couldn’t save your profile. Try again.
          </p>
        )}

        <button type="submit" className="btn-primary w-auto px-8" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <section className="mt-8 rounded-sm border border-paper-line bg-paper-card p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Appearance</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-ink">Switch between light and dark mode</p>
          <ThemeToggle />
        </div>
      </section>

      <form onSubmit={sendFeedback} className="mt-8 rounded-sm border border-paper-line bg-paper-card p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Send feedback</p>
        <p className="mt-1 text-sm text-ink-faint">Found a bug or have an idea? Tell us — it goes straight to the team.</p>
        <textarea
          className="mt-3 w-full rounded-sm border border-paper-line bg-paper p-3 text-sm text-ink focus:border-highlighter-deep focus:outline-none"
          rows={4}
          maxLength={2000}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          aria-label="Your feedback"
        />
        {feedbackState === 'sent' && <p className="mt-2 rounded-sm bg-correct/10 px-3 py-2 text-sm text-correct">Thanks! Your feedback was sent.</p>}
        {feedbackState && feedbackState !== 'sent' && <p className="mt-2 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag">{feedbackState}</p>}
        <button type="submit" className="btn-secondary mt-3 w-auto px-6" disabled={sendingFeedback || feedback.trim().length < 5}>
          {sendingFeedback ? 'Sending…' : 'Send feedback'}
        </button>
      </form>

      <section className="mt-8 rounded-sm border border-flag/40 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-flag">Delete account</p>
        <p className="mt-2 text-sm text-ink-faint">
          This permanently deletes your login, documents, quizzes, flashcards, predictor sessions and uploaded files. It cannot be undone.
        </p>
        <label htmlFor="confirmDelete" className="field-label mt-4">Type DELETE to confirm</label>
        <input id="confirmDelete" className="field-line" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        {deleteError && <p className="mt-2 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">{deleteError}</p>}
        <button
          type="button"
          onClick={deleteAccount}
          disabled={confirmText !== 'DELETE' || deleting}
          className="mt-4 rounded-sm bg-flag px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting ? 'Deleting…' : 'Permanently delete my account'}
        </button>
      </section>

      <Link to="/dashboard" className="mt-6 mr-6 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink">
        ← Dashboard
      </Link>
      <button
        type="button"
        onClick={logout}
        className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-flag"
      >
        Log out
      </button>
    </div>
  );
}
