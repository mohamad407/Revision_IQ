import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';

export default function ForgotPassword() {
  const { resetPassword, authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!email.trim()) {
      setFieldError('Enter your email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('Enter a valid email address.');
      return;
    }
    setFieldError('');

    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      // authError already set by context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="We’ll email you a link to set a new one."
    >
      {sent ? (
        <div className="rounded-sm border border-correct/30 bg-correct/10 px-4 py-4 text-sm text-correct">
          If an account exists for <span className="font-semibold">{email}</span>, a reset
          link is on its way. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@university.edu"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError}
          />

          {authError && (
            <p className="rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
              {authError}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Sending link…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-ink-faint">
        Remembered it after all?{' '}
        <Link to="/login" className="font-semibold text-ink underline underline-offset-2">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
