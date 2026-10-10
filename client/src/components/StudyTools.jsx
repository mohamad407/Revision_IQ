import { useState } from 'react';
import api from '../lib/api';

const TOOLS = [
  { key: 'cheatsheet', label: 'Cheat sheet', blurb: 'Every formula, definition and key fact on one page.' },
  { key: 'simple', label: 'Explain simply', blurb: 'The same material in plain, beginner-friendly language.' },
  { key: 'example', label: 'Real-life examples', blurb: 'Ideas explained through everyday situations.' },
  { key: 'mnemonics', label: 'Memory tricks', blurb: 'Acronyms and phrases for lists that are hard to remember.' },
  { key: 'conceptmap', label: 'Concept map', blurb: 'How the main ideas connect.' },
];

const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint';

function CheatSheet({ data }) {
  return (
    <div id="print-area">
      <h3 className="font-display text-lg font-medium text-ink">{data.title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {data.sections.map((s, i) => (
          <div key={i} className="rounded-sm border border-paper-line p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-highlighter-deep">{s.heading}</p>
            <ul className="mt-2 space-y-1.5">
              {s.items.map((it, j) => (
                <li key={j} className="text-sm text-ink">• {it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Paragraphs({ data }) {
  return (
    <div>
      <h3 className="font-display text-lg font-medium text-ink">{data.title}</h3>
      <div className="mt-3 space-y-3">
        {data.paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-ink-soft">{p}</p>
        ))}
      </div>
    </div>
  );
}

function Mnemonics({ data }) {
  return (
    <div className="space-y-3">
      {data.items.map((m, i) => (
        <div key={i} className="rounded-sm border border-paper-line p-3">
          <p className={label}>{m.topic}</p>
          <p className="mt-1 font-display text-base font-medium text-ink">{m.mnemonic}</p>
          {m.explanation && <p className="mt-1 text-sm text-ink-faint">{m.explanation}</p>}
        </div>
      ))}
    </div>
  );
}

function ConceptMap({ data }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-sm bg-ink px-5 py-3 text-center font-display text-base font-medium text-paper">
        {data.center}
      </div>
      <div className="h-5 w-px bg-paper-line" aria-hidden="true" />
      <div className="grid w-full gap-3 sm:grid-cols-2">
        {data.branches.map((b, i) => (
          <div key={i} className="rounded-sm border border-paper-line p-3">
            <p className="font-display text-sm font-medium text-ink">{b.label}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {b.children.map((c, j) => (
                <span key={j} className="rounded-full bg-highlighter/15 px-2.5 py-1 text-xs text-ink">{c}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudyTools({ docId }) {
  const [active, setActive] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async (tool, force = false) => {
    setActive(tool);
    setError('');
    if (results[tool] && !force) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/documents/${docId}/tools`, { tool, force });
      setResults((r) => ({ ...r, [tool]: data.data.data }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not generate this. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const current = TOOLS.find((t) => t.key === active);
  const data = active ? results[active] : null;

  return (
    <section className="mt-8 rounded-sm border border-paper-line bg-paper-card p-6">
      <p className={label}>Study tools</p>
      <h2 className="mt-2 font-display text-xl font-medium text-ink">More ways to learn this document</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => run(t.key)}
            disabled={loading}
            className={`rounded-sm border px-3 py-2 text-sm transition-colors disabled:opacity-60 ${
              active === t.key ? 'border-ink bg-ink text-paper' : 'border-paper-line text-ink hover:border-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {current && <p className="mt-3 text-xs text-ink-faint">{current.blurb}</p>}
      {error && <p className="mt-3 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">{error}</p>}
      {loading && <div className="mt-4 h-32 animate-pulse rounded-sm bg-paper-line" />}

      {!loading && data && (
        <div className="mt-4">
          {active === 'cheatsheet' && <CheatSheet data={data} />}
          {(active === 'simple' || active === 'example') && <Paragraphs data={data} />}
          {active === 'mnemonics' && <Mnemonics data={data} />}
          {active === 'conceptmap' && <ConceptMap data={data} />}

          <div className="no-print mt-4 flex gap-5">
            {active === 'cheatsheet' && (
              <button onClick={() => window.print()} className={`${label} hover:text-ink`}>
                Print / save as PDF ↓
              </button>
            )}
            <button onClick={() => run(active, true)} className={`${label} hover:text-ink`}>
              Regenerate
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
