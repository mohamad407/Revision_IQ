export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — hidden on small screens */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-paper lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-highlighter font-display text-sm font-semibold text-ink">
            R
          </span>
          <span className="font-display text-lg font-medium tracking-tight">RevisionIQ</span>
        </div>

        <div className="max-w-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-highlighter">
            margin note
          </p>
          <p className="mt-3 font-display text-3xl leading-snug text-paper">
            Upload the lecture.{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Skip the re-reading.</span>
              <span className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 bg-highlighter/30" />
            </span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-paper/70">
            RevisionIQ turns a PDF into a structured summary and a five-question
            quiz in under a minute — so you spend your study time being tested,
            not re-reading.
          </p>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/40">
          Built for the night before the exam
        </p>

        {/* decorative rotated "sticky note" tag */}
        <div className="pointer-events-none absolute -right-10 top-1/3 h-28 w-28 rotate-6 rounded-sm bg-highlighter/90 p-3 text-ink shadow-lg">
          <p className="font-mono text-[10px] uppercase tracking-widest">Quiz Score</p>
          <p className="mt-1 font-display text-2xl font-semibold">4/5</p>
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
