import { Link, useNavigate } from 'react-router-dom';

export default function IntroPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-paper">
      {/* ambient motion */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-highlighter/25 blur-[130px] animate-drift-slow" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-correct/20 blur-[140px] animate-drift-slower" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-flag/10 blur-[110px] animate-drift-slow" />
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

      {/* hero text */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-14 text-center sm:px-10 sm:pt-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-highlighter">
          For the night before the exam
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-4xl font-medium leading-[1.08] sm:text-6xl">
          Turn any lecture into
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">something you actually remember.</span>
            <span className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 bg-highlighter/30 animate-highlight-sweep sm:bottom-2 sm:h-4" />
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
          Drop in a PDF. RevisionIQ reads it, pulls out what matters, and
          quizzes you on it — summary and score in under a minute.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
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
      </div>

      {/* illustrated product scene */}
      <div className="relative z-10 mt-14 flex justify-center px-6 sm:mt-20 sm:px-10">
        <div className="relative w-full max-w-4xl [perspective:1800px]">
          {/* glow behind the scene */}
          <div className="pointer-events-none absolute inset-x-10 -top-6 h-24 rounded-full bg-highlighter/20 blur-3xl animate-glow-pulse" />

          {/* sparkle accents */}
          <Sparkle className="left-4 top-2 text-highlighter" delay="0s" />
          <Sparkle className="right-10 top-16 text-correct" delay="0.6s" />
          <Sparkle className="left-1/2 -top-4 text-paper/60" delay="1.1s" />

          {/* main browser-style frame, gently tilted */}
          <div
            className="relative rounded-md border border-paper/10 bg-ink-soft/80 shadow-2xl backdrop-blur-sm animate-float-a"
            style={{ transform: 'rotateX(8deg) rotateY(-4deg)' }}
          >
            {/* chrome bar */}
            <div className="flex items-center gap-2 border-b border-paper/10 px-5 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-flag/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-highlighter/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-correct/70" />
              <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-paper/40">
                revisioniq.app/dashboard
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-[auto,1fr] sm:p-8">
              {/* fake sidebar */}
              <div className="hidden w-32 flex-col gap-2 sm:flex">
                {['Upload', 'Summary', 'Quiz', 'Predictor'].map((label, i) => (
                  <div
                    key={label}
                    className={`rounded-sm px-3 py-2 font-mono text-[10px] uppercase tracking-wide ${
                      i === 0 ? 'bg-highlighter/90 text-ink' : 'text-paper/40'
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* fake main content: upload -> scan -> summary -> quiz score, left to right */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MiniCard title="Lecture_09.pdf" tone="upload">
                  <div className="flex h-16 items-center justify-center rounded-sm border-2 border-dashed border-paper/20">
                    <div className="h-7 w-6 rounded-sm bg-flag/70" />
                  </div>
                </MiniCard>

                <MiniCard title="Scanning" tone="scan">
                  <div className="relative h-16 overflow-hidden rounded-sm border border-paper/10 p-2">
                    <div className="space-y-1.5">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-1.5 rounded-full bg-paper/15"
                          style={{ width: `${80 - i * 12}%` }}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-correct/40 to-transparent animate-scan-line" />
                  </div>
                </MiniCard>

                <MiniCard title="Summary" tone="summary">
                  <div className="space-y-1.5 rounded-sm border border-paper/10 p-2">
                    <div className="h-1.5 w-3/4 rounded-full bg-highlighter/70" />
                    <div className="h-1.5 w-full rounded-full bg-paper/20" />
                    <div className="h-1.5 w-5/6 rounded-full bg-paper/20" />
                  </div>
                </MiniCard>

                <MiniCard title="Quiz" tone="quiz">
                  <div className="flex h-16 flex-col items-center justify-center rounded-sm border border-paper/10">
                    <p className="font-display text-2xl font-semibold text-flag">4/5</p>
                  </div>
                </MiniCard>
              </div>
            </div>
          </div>

          {/* a smaller floating card peeking out bottom-left, like the auth panel */}
          <div
            className="absolute -bottom-8 -left-6 hidden w-36 rounded-sm border border-paper/10 bg-correct/90 p-3 text-paper shadow-2xl backdrop-blur-sm animate-float-b sm:block"
            style={{ transform: 'rotateY(10deg) rotate(-3deg)' }}
          >
            <p className="font-mono text-[9px] uppercase tracking-widest text-paper/70">Uploaded</p>
            <p className="mt-1 text-xs font-medium leading-snug">Thermodynamics_Ch4.pdf</p>
          </div>
        </div>
      </div>

      {/* feature strip with icon glyphs */}
      <div className="relative z-10 mx-auto mt-20 grid w-full max-w-3xl grid-cols-1 gap-8 px-6 pb-16 sm:grid-cols-3 sm:px-10">
        <Feature icon="upload" tone="highlighter" title="Upload" body="Any lecture PDF, chapter, or slide export." />
        <Feature icon="scan" tone="correct" title="AI reads it" body="Gemini pulls out what actually matters." />
        <Feature icon="quiz" tone="flag" title="Get quizzed" body="Five questions, graded instantly." />
      </div>
    </div>
  );
}

function MiniCard({ title, children }) {
  return (
    <div className="rounded-sm border border-paper/10 bg-ink/40 p-2.5">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-paper/40">{title}</p>
      {children}
    </div>
  );
}

function Sparkle({ className = '', delay = '0s' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`pointer-events-none absolute h-4 w-4 animate-twinkle ${className}`}
      style={{ animationDelay: delay }}
    >
      <path d="M12 0l1.8 8.2L22 10l-8.2 1.8L12 20l-1.8-8.2L2 10l8.2-1.8L12 0z" />
    </svg>
  );
}

function Feature({ icon, tone, title, body }) {
  const toneClasses = {
    highlighter: 'bg-highlighter/15 text-highlighter',
    correct: 'bg-correct/15 text-correct',
    flag: 'bg-flag/15 text-flag',
  };
  return (
    <div className="text-center sm:text-left">
      <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full sm:mx-0 ${toneClasses[tone]}`}>
        <FeatureIcon icon={icon} />
      </div>
      <h3 className="mt-3 font-display text-lg font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-paper/60">{body}</p>
    </div>
  );
}

function FeatureIcon({ icon }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (icon === 'upload') {
    return (
      <svg {...common}>
        <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    );
  }
  if (icon === 'scan') {
    return (
      <svg {...common}>
        <path d="M3 7V5a2 2 0 0 1 2-2h2M21 7V5a2 2 0 0 0-2-2h-2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M3 12h18" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
