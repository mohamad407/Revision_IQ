import { useState } from 'react';
import { Link } from 'react-router-dom';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint';

// Whole days between local "today" and a stored exam date (YYYY-MM-DD prefix).
function daysUntil(dateStr) {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  const now = new Date();
  const target = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

function Tile({ title, value, sub, to }) {
  const inner = (
    <>
      <p className={label}>{title}</p>
      <p className="mt-2 font-display text-3xl font-medium text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-faint">{sub}</p>
    </>
  );
  const cls = 'rounded-sm border border-paper-line bg-paper-card p-4';
  return to ? (
    <Link to={to} className={`${cls} transition-colors hover:border-ink`}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function ExamCard({ exam, onSave }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(exam?.name || '');
  const [date, setDate] = useState(exam?.date ? String(exam.date).slice(0, 10) : '');
  const [saving, setSaving] = useState(false);

  const save = async (payload) => {
    setSaving(true);
    try {
      await onSave(payload);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (exam?.date && !editing) {
    const days = daysUntil(exam.date);
    return (
      <div className="rounded-sm border border-paper-line bg-ink p-4 text-paper">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-highlighter">Exam countdown</p>
        <p className="mt-2 font-display text-3xl font-medium">
          {days > 0 ? `${days} day${days === 1 ? '' : 's'}` : days === 0 ? 'Today' : 'Done'}
        </p>
        <p className="mt-1 text-xs text-paper/70">
          {days >= 0 ? `until ${exam.name || 'your exam'}` : `${exam.name || 'Exam'} was ${Math.abs(days)} day(s) ago`}
        </p>
        <div className="mt-3 flex gap-4 font-mono text-[10px] uppercase tracking-widest text-paper/60">
          <button onClick={() => setEditing(true)} className="hover:text-paper">Edit</button>
          <button onClick={() => save(null)} disabled={saving} className="hover:text-paper">Clear</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-dashed border-paper-line bg-paper-card p-4">
      <p className={label}>Exam countdown</p>
      <input
        className="field-line mt-2"
        placeholder="Exam name (e.g. FAT)"
        maxLength={100}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Exam name"
      />
      <input
        type="date"
        className="field-line mt-2"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Exam date"
      />
      <div className="mt-3 flex gap-4 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        <button
          disabled={!date || saving}
          onClick={() => save({ name: name.trim() || 'Exam', date })}
          className="hover:text-ink disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {exam?.date && <button onClick={() => setEditing(false)} className="hover:text-ink">Cancel</button>}
      </div>
    </div>
  );
}

export default function StatsPanel({ stats, onSaveExam }) {
  if (!stats) {
    return (
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-sm bg-paper-line" />
        ))}
      </div>
    );
  }

  const { streak, week, flashcards, quizzes, weakDocuments, nextExam, today } = stats;
  const max = Math.max(1, ...week.map((d) => d.count));
  const doneToday = today.quizzes + today.cards;

  return (
    <section className="mt-8" aria-label="Your progress">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          title="Study streak"
          value={`${streak.current} day${streak.current === 1 ? '' : 's'}`}
          sub={streak.current === 0 ? 'Study today to start one' : `Best: ${streak.longest}`}
        />
        <Tile
          title="Cards due"
          value={flashcards.due}
          sub={flashcards.total ? 'Tap to start reviewing' : 'Make flashcards from a document'}
          to="/flashcards"
        />
        <Tile
          title="Quiz average"
          value={quizzes.averagePercent === null ? '—' : `${quizzes.averagePercent}%`}
          sub={`${quizzes.attempts} attempt${quizzes.attempts === 1 ? '' : 's'}`}
        />
        <ExamCard exam={nextExam} onSave={onSaveExam} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-sm border border-paper-line bg-paper-card p-4">
          <div className="flex items-baseline justify-between">
            <p className={label}>Last 7 days</p>
            <p className="text-xs text-ink-faint">
              {doneToday > 0 ? `${doneToday} activit${doneToday === 1 ? 'y' : 'ies'} today` : 'Nothing yet today'}
            </p>
          </div>
          <div className="mt-4 flex h-20 items-end gap-2" role="img" aria-label="Activity over the last 7 days">
            {week.map((d, i) => {
              const dow = new Date(`${d.day}T00:00:00Z`).getUTCDay();
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm ${d.count ? 'bg-highlighter-deep' : 'bg-paper-line'}`}
                    style={{ height: `${d.count ? Math.max(12, (d.count / max) * 100) : 6}%` }}
                    title={`${d.count} activities`}
                  />
                  <span className={`font-mono text-[10px] ${i === 6 ? 'text-ink' : 'text-ink-faint'}`}>
                    {DAY_LETTERS[dow]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-sm border border-paper-line bg-paper-card p-4">
          <p className={label}>Revise next</p>
          {weakDocuments.length === 0 ? (
            <p className="mt-3 text-sm text-ink-faint">
              {quizzes.attempts === 0
                ? 'Take a quiz and your weakest topics will show up here.'
                : 'No weak spots — every quiz is above 75%. Keep it up!'}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {weakDocuments.map((d) => (
                <li key={d.documentId}>
                  <Link
                    to={`/documents/${d.documentId}`}
                    className="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 hover:bg-paper"
                  >
                    <span className="truncate text-sm text-ink">{d.name}</span>
                    <span className="flex-shrink-0 rounded-full bg-flag/10 px-2 py-0.5 font-mono text-[10px] text-flag">
                      {d.percent}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
