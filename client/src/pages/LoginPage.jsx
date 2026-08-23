import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import SocialAuthRow from '../components/SocialAuthRow';

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle, authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) {
      errors.email = 'Enter your email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!form.password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await loginWithEmail(form);
      navigate(redirectTo, { replace: true });
    } catch {
      // authError already set by context
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    clearError();
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch {
      // authError already set by context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in"
      subtitle="Pick up your revision where you left off."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
        <div>
          <FormField
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Your password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="font-mono text-[11px] uppercase tracking-wide text-ink-faint hover:text-ink"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {authError && (
          <p className="rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">
            {authError}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-paper-line" />
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">or</span>
        <div className="h-px flex-1 bg-paper-line" />
      </div>

      <SocialAuthRow onGoogleClick={handleGoogle} loading={submitting} />

      <p className="mt-8 text-center text-sm text-ink-faint">
        New to RevisionIQ?{' '}
        <Link to="/signup" className="font-semibold text-ink underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
