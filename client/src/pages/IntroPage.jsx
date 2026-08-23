import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Story-style animated walkthrough shown once before auth. Auto-advances
// like a short video; the person can skip, tap a dot, or just wait it out.
const SLIDES = [
  {
    eyebrow: 'Step 1',
    title: 'Upload the lecture PDF',
    body: 'Drop in a lecture, chapter, or slide export — RevisionIQ reads it in seconds.',
    accent: 'highlighter',
    icon: 'upload',
  },
  {
    eyebrow: 'Step 2',
    title: 'AI reads every page',
    body: 'Gemini scans the document and pulls out what actually matters for the exam.',
    accent: 'correct',
    icon: 'scan',
  },
  {
    eyebrow: 'Step 3',
    title: 'Get a structured summary',
    body: 'Headline, key points, no fluff — everything you would have spent an hour re-reading.',
    accent: 'highlighter',
    icon: 'summary',
  },
  {
    eyebrow: 'Step 4',
    title: 'Take the quiz. See your score.',
    body: 'Five questions generated from your document, graded instantly.',
    accent: 'flag',
    icon: 'quiz',
  },
];

const SLIDE_DURATION_MS = 3800;

export default function IntroPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef();
  const startRef = useRef(performance.now());

  const goTo = (index) => {
    setActive(index);
    setProgress(0);
    startRef.current = performance.now();
  };

  const finish = () => navigate('/login', { replace: true });

  useEffect(() => {
    const tick = (now) => {
      const elapsed = now - startRef.current;
      const pct = Math.min(elapsed / SLIDE_DURATION_MS, 1);
      setProgress(pct);

      if (pct >= 1) {
        if (active < SLIDES.length - 1) {
          goTo(active + 1);
        } else {
          finish();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const slide = SLIDES[active];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-paper">
      {/* ambient motion, same language as the auth panel */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-highlighter/25 blur-[110px] animate-drift-slow" />
      <div className="pointer-events-none absolute bottom-0 -right-24 h-96 w-96 rounded-full bg-correct/20 blur-[120px] animate-drift-slower" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] animate-pan-grid"
        style={{
          backgroundImage: 'radial-gradient(#F4F6F5 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* top bar: progress + skip */}
      <div className="relative z-10 flex items-center gap-4 px-6 pt-8 sm:px-12">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-highlighter font-display text-sm font-semibold text-ink">
            R
          </span>
          <span className="font-display text-base font-medium tracking-tight">RevisionIQ</span>
        </div>

        <div className="ml-4 flex flex-1 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className="h-1 flex-1 overflow-hidden rounded-full bg-paper/15"
              aria-label={`Go to slide ${i + 1}`}
            >
              <div
                className="h-full bg-highlighter"
                style={{
                  width: i < active ? '100%' : i === active ? `${progress * 100}%` : '0%',
                  transition: i === active ? 'none' : 'width 200ms ease',
                }}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={finish}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60 hover:text-paper"
        >
          Skip intro
        </button>
      </div>

      {/* main slide content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16 sm:px-12">
        <div className="grid w-full max-w-5xl items-center gap-16 lg:grid-cols-2">
          {/* text side */}
          <div key={active} className="animate-slide-in">
            <p className={`font-mono text-[11px] uppercase tracking-[0.14em] text-${slide.accent}`}>
              {slide.eyebrow} · {active + 1} / {SLIDES.length}
            </p>
            <h1 className="mt-3 font-display text-4xl font-medium leading-tight sm:text-5xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-paper/70">
              {slide.body}
            </p>

            <div className="mt-10 flex items-center gap-4">
              <button onClick={finish} className="btn-primary w-auto bg-highlighter px-7 text-ink hover:bg-highlighter-deep">
                Get started
              </button>
              <button
                onClick={() => (active < SLIDES.length - 1 ? goTo(active + 1) : finish())}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50 hover:text-paper"
              >
                {active < SLIDES.length - 1 ? 'Next →' : 'Continue →'}
              </button>
            </div>
          </div>

          {/* visual side — 3D tilted "scene" card that swaps per slide */}
          <div key={`visual-${active}`} className="flex justify-center [perspective:1400px]">
            <SlideVisual slide={slide} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideVisual({ slide }) {
  return (
    <div
      className="relative h-72 w-72 animate-scene-in [transform-style:preserve-3d] sm:h-80 sm:w-80"
      style={{ transform: 'rotateY(-10deg) rotateX(6deg)' }}
    >
      <div className={`absolute inset-0 rounded-sm border border-paper/10 bg-ink-soft/70 p-6 shadow-2xl backdrop-blur-sm animate-float-a`}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-paper/40">RevisionIQ</p>

        {slide.icon === 'upload' && (
          <div className="mt-6 flex h-40 flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed border-paper/20">
            <div className="h-10 w-8 rounded-sm bg-flag/70" />
            <p className="font-mono text-[10px] uppercase tracking-wide text-paper/50">Lecture_09.pdf</p>
          </div>
        )}

        {slide.icon === 'scan' && (
          <div className="relative mt-6 h-40 overflow-hidden rounded-sm border border-paper/10 p-3">
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-1.5 rounded-full bg-paper/15" style={{ width: `${70 - i * 6}%` }} />
              ))}
            </div>
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-correct/40 to-transparent animate-scan-line" />
          </div>
        )}

        {slide.icon === 'summary' && (
          <div className="mt-6 space-y-2.5 rounded-sm border border-paper/10 p-3">
            <div className="h-2 w-3/4 rounded-full bg-highlighter/70" />
            <div className="h-1.5 w-full rounded-full bg-paper/20" />
            <div className="h-1.5 w-5/6 rounded-full bg-paper/20" />
            <div className="h-1.5 w-2/3 rounded-full bg-paper/20" />
            <div className="h-1.5 w-4/5 rounded-full bg-paper/15" />
          </div>
        )}

        {slide.icon === 'quiz' && (
          <div className="mt-6 flex h-40 flex-col items-center justify-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50">Quiz score</p>
            <p className="font-display text-5xl font-semibold text-flag">4/5</p>
          </div>
        )}
      </div>
    </div>
  );
}
