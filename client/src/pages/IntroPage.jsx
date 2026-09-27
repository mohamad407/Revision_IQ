import { Link, useNavigate } from 'react-router-dom';

// Single massive hero, same energy as a ChatGPT/Linear-style landing screen —
// one huge headline, one line of subtext, two buttons. No slides, no steps.
export default function IntroPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-paper">
      {/* ambient motion — same language as the auth panel */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-highlighter/25 blur-[130px] animate-drift-slow" />
      <div className="pointer-events-none absolute bottom-0 -right-32 h-[28rem] w-[28rem] rounded-full bg-correct/20 blur-[140px] animate-drift-slower" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-flag/10 blur-[110px] animate-drift-slow" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1] animate-pan-grid"
        style={{
          backgroundImage: 'radial-gradient(#F4F6F5 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-8 sm:px-12">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-highlighter font-display text-sm font-semibold text-ink shadow-[0_8px_20px_-6px_rgba(255,201,74,0.6)]">
            R
          </span>
          <span className="font-display text-lg font-medium tracking-tight">RevisionIQ</span>
        </div>

        <Link
          to="/login"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60 transition-colors hover:text-paper"
        >
          Log in
        </Link>
      </div>

      {/* massive centered hero */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-highlighter">
          For the night before the exam
        </p>

        <h1 className="mt-5 max-w-4xl font-display text-5xl font-medium leading-[1.05] sm:text-7xl">
          Turn any lecture into
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">something you actually remember.</span>
            <span className="absolute inset-x-0 bottom-2 z-0 h-4 -rotate-1 bg-highlighter/30 animate-highlight-sweep sm:bottom-3 sm:h-5" />
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
          Drop in a PDF. RevisionIQ reads it, pulls out what matters, and
          quizzes you on it — summary and score in under a minute.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <button
            onClick={() => navigate('/signup')}
            className="btn-primary w-auto bg-highlighter px-8 py-3.5 text-ink hover:bg-highlighter-deep"
          >
            Get started — it's free
          </button>
          <Link
            to="/login"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60 transition-colors hover:text-paper"
          >
            I already have an account →
          </Link>
        </div>

        {/* three quiet proof points instead of a step-by-step walkthrough */}
        <div className="mt-16 grid w-full max-w-2xl grid-cols-1 gap-6 border-t border-paper/10 pt-10 sm:grid-cols-3">
          <Stat value="60s" label="PDF to summary" />
          <Stat value="5Q" label="Auto-generated quiz" />
          <Stat value="0" label="Hours re-reading" />
        </div>
      </div>

      <p className="relative z-10 pb-8 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-paper/40">
        Built for students, not lecture halls
      </p>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-3xl font-medium text-highlighter">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-paper/50">
        {label}
      </p>
    </div>
  );
}
