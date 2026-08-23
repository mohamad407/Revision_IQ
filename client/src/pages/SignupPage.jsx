import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import SocialAuthRow from '../components/SocialAuthRow';

const initialForm = { name: '', email: '', password: '', confirmPassword: '' };

export default function SignupPage() {
  const { signupWithEmail, loginWithGoogle, authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Enter your name.';
    if (!form.email.trim()) {
      errors.email = 'Enter your email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      errors.password = 'Enter a password.';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Passwords don’t match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await signupWithEmail(form);
      navigate('/dashboard', { replace: true });
    } catch {
      // authError is already set by the context
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    clearError();
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch {
      // authError is already set by the context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="Free while RevisionIQ is in early access."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          id="name"
          name="name"
          label="Full name"
          placeholder="Full name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@university.edu"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />
        <FormField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
        />

        {authError && (
          <p className="rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
            {authError}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-paper-line" />
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">or</span>
        <div className="h-px flex-1 bg-paper-line" />
      </div>

      <SocialAuthRow onGoogleClick={handleGoogle} loading={submitting} />

      <p className="mt-8 text-center text-sm text-ink-faint">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-ink underline underline-offset-2">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
