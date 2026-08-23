export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — hidden on small screens */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-paper lg:flex [perspective:1200px]">
        {/* Drifting gradient orbs — the depth/colour layer */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-highlighter/30 blur-[90px] animate-drift-slow" />
        <div className="pointer-events-none absolute bottom-10 -right-16 h-80 w-80 rounded-full bg-correct/25 blur-[100px] animate-drift-slower" />
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-56 w-56 rounded-full bg-flag/10 blur-[80px] animate-drift-slow" />

        {/* Dot-grid texture, gently panning */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15] animate-pan-grid"
          style={{
            backgroundImage: 'radial-gradient(#F4F6F5 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-highlighter font-display text-sm font-semibold text-ink shadow-[0_8px_20px_-6px_rgba(255,201,74,0.6)]">
            R
          </span>
          <span className="font-display text-lg font-medium tracking-tight">RevisionIQ</span>
        </div>

        {/* Copy + 3D card stack */}
        <div className="relative z-10 max-w-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-highlighter">
            margin note
          </p>
          <p className="mt-3 font-display text-3xl leading-snug text-paper">
            Upload the lecture.{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Skip the re-reading.</span>
              <span className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 bg-highlighter/30 animate-highlight-sweep" />
            </span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-paper/70">
            RevisionIQ turns a PDF into a structured summary and a five-question
            quiz in under a minute — so you spend your study time being tested,
            not re-reading.
          </p>
        </div>

        <p className="relative z-10 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/40">
          Built for the night before the exam
        </p>

        {/* 3D floating card stack — tilted, layered, gently bobbing */}
        <div className="pointer-events-none absolute right-6 top-[38%] [transform-style:preserve-3d]">
          <div
            className="absolute -left-16 top-10 w-32 rounded-sm border border-paper/10 bg-ink-soft/80 p-3 text-paper shadow-2xl backdrop-blur-sm animate-float-a"
            style={{ transform: 'rotateY(18deg) rotateX(6deg) rotate(-4deg)' }}
          >
            <p className="font-mono text-[9px] uppercase tracking-widest text-paper/50">Summary</p>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-paper/25" />
              <div className="h-1.5 w-4/5 rounded-full bg-paper/25" />
              <div className="h-1.5 w-3/5 rounded-full bg-paper/15" />
            </div>
          </div>

          <div
            className="relative h-28 w-28 rounded-sm bg-highlighter p-3 text-ink shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-float-b"
            style={{ transform: 'rotateY(-14deg) rotateX(-4deg) rotate(6deg)' }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest">Quiz Score</p>
            <p className="mt-1 font-display text-2xl font-semibold">4/5</p>
          </div>

          <div
            className="absolute left-12 top-32 w-28 rounded-sm border border-paper/10 bg-correct/90 p-3 text-paper shadow-2xl animate-float-c"
            style={{ transform: 'rotateY(10deg) rotateX(8deg) rotate(-2deg)' }}
          >
            <p className="font-mono text-[9px] uppercase tracking-widest text-paper/70">Uploaded</p>
            <p className="mt-1 text-xs font-medium leading-snug">Lecture_09.pdf</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center bg-paper px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-highlighter font-display text-sm font-semibold text-ink">
                R
              </span>
              <span className="font-display text-base font-medium tracking-tight">
                RevisionIQ
              </span>
            </div>
          </div>

          {eyebrow && (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-faint">{subtitle}</p>}

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
