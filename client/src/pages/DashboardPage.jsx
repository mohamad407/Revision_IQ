import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { firebaseUser, logout } = useAuth();

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

      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          You’re in
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-ink">
          Welcome back{firebaseUser?.displayName ? `, ${firebaseUser.displayName.split(' ')[0]}` : ''}.
        </h1>
        <p className="mt-3 text-sm text-ink-faint">
          Document upload, summaries, and quizzes plug in here next — this is
          the protected route auth now guards.
        </p>
      </main>
    </div>
  );
}
