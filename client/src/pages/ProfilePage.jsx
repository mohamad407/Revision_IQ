import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import api from '../lib/api';

const emptyAcademicFields = { university: '', department: '', semester: '' };

export default function ProfilePage() {
  const { firebaseUser, profile, setProfile, logout } = useAuth();

  const [fields, setFields] = useState(emptyAcademicFields);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    if (profile) {
      setFields({
        university: profile.university || '',
        department: profile.department || '',
        semester: profile.semester || '',
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
