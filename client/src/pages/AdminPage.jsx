import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint';
const TABS = ['Overview', 'Users', 'Feedback'];

function Stat({ title, value, sub }) {
  return (
    <div className="rounded-sm border border-paper-line bg-paper-card p-4">
      <p className={label}>{title}</p>
      <p className="mt-2 font-display text-2xl font-medium text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}

function Overview() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get('/admin/overview').then((r) => setD(r.data.data)).catch((e) => setErr(e?.response?.data?.message || 'Failed to load'));
  }, []);
  if (err) return <p className="text-sm text-flag">{err}</p>;
  if (!d) return <div className="h-40 animate-pulse rounded-sm bg-paper-line" />;
  const max = Math.max(1, ...d.daily.map((x) => x.quizzes + x.cards));
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat title="Students" value={d.users.total} sub={`${d.users.new7d} new this week`} />
        <Stat title="Active (7 days)" value={d.users.active7d} sub={`${d.users.disabled} disabled`} />
        <Stat title="Documents" value={d.content.documents} sub={`${d.content.scannedDocuments} scanned (OCR)`} />
        <Stat title="Open feedback" value={d.openFeedback} />
        <Stat title="Quizzes" value={d.content.quizzes} />
        <Stat title="Flashcards" value={d.content.flashcards} sub={`${d.content.sharedDecks} shared decks`} />
        <Stat title="Predictor sessions" value={d.content.predictorSessions} />
      </div>
      <div className="mt-4 rounded-sm border border-paper-line bg-paper-card p-4">
        <p className={label}>Activity, last 7 days (quizzes + cards)</p>
        {d.daily.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">No activity yet.</p>
        ) : (
          <div className="mt-4 flex h-24 items-end gap-2">
            {d.daily.map((x) => (
              <div key={x.day} className="flex flex-1 flex-col items-center gap-1" title={`${x.day}: ${x.students} students`}>
                <div className="w-full rounded-sm bg-highlighter-deep" style={{ height: `${Math.max(8, ((x.quizzes + x.cards) / max) * 100)}%` }} />
                <span className="font-mono text-[10px] text-ink-faint">{x.day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Users() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const { data: r } = await api.get('/admin/users', { params: { q, page } });
      setData(r.data);
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to load users');
    }
  }, [q, page]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const toggle = async (u) => {
    if (!window.confirm(`${u.disabled ? 'Enable' : 'Disable'} ${u.email}?`)) return;
    try {
      await api.post(`/admin/users/${u._id}/disabled`, { disabled: !u.disabled });
      load();
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div>
      <input className="field-line" placeholder="Search by name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search users" />
      {err && <p className="mt-3 text-sm text-flag">{err}</p>}
      {!data ? <div className="mt-4 h-40 animate-pulse rounded-sm bg-paper-line" /> : (
        <>
          <div className="mt-4 overflow-x-auto rounded-sm border border-paper-line">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-paper-card">
                <tr className={label}>
                  <th className="px-3 py-2 font-normal">User</th>
                  <th className="px-3 py-2 font-normal">Docs</th>
                  <th className="px-3 py-2 font-normal">Last login</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u._id} className="border-t border-paper-line">
                    <td className="px-3 py-2">
                      <p className="text-ink">{u.name || '—'} {u.role === 'admin' && <span className="ml-1 rounded-full bg-highlighter/20 px-2 py-0.5 text-[10px] text-ink">admin</span>}</p>
                      <p className="text-xs text-ink-faint">{u.email}</p>
                    </td>
                    <td className="px-3 py-2 text-ink-faint">{u.documents}</td>
                    <td className="px-3 py-2 text-xs text-ink-faint">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {u.role !== 'admin' && (
                        <button onClick={() => toggle(u)} className={`${label} ${u.disabled ? 'text-correct' : 'hover:text-flag'}`}>
                          {u.disabled ? 'Enable' : 'Disable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
            <span>{data.total} users</span>
            <span className="flex gap-4">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">← Prev</button>
              <span>{data.page} / {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">Next →</button>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function Feedback() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => {
    api.get('/admin/feedback').then((r) => setItems(r.data.data)).catch((e) => setErr(e?.response?.data?.message || 'Failed to load'));
  }, []);
  useEffect(load, [load]);
  const done = async (id) => {
    await api.post(`/admin/feedback/${id}/done`).catch(() => {});
    load();
  };
  if (err) return <p className="text-sm text-flag">{err}</p>;
  if (!items) return <div className="h-40 animate-pulse rounded-sm bg-paper-line" />;
  if (items.length === 0) return <p className="text-sm text-ink-faint">No open feedback. 🎉</p>;
  return (
    <ul className="space-y-3">
      {items.map((f) => (
        <li key={f._id} className="rounded-sm border border-paper-line bg-paper-card p-4">
          <p className="whitespace-pre-line text-sm text-ink">{f.message}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
            <span>{f.email} · {f.page || 'no page'} · {new Date(f.createdAt).toLocaleDateString()}</span>
            <button onClick={() => done(f._id)} className={`${label} hover:text-correct`}>Mark done</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminPage() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState('Overview');

  if (loading) return null;
  if (profile?.role !== 'admin') {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-12">
        <p className="text-sm text-flag">You do not have access to this page.</p>
        <Link to="/dashboard" className={`mt-4 inline-block hover:text-ink ${label}`}>← Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <Link to="/dashboard" className={`hover:text-ink ${label}`}>← Back to dashboard</Link>
      <p className={`mt-6 ${label}`}>Admin</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">RevisionIQ control panel</h1>
      <div className="mt-6 flex gap-2 border-b border-paper-line">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === t ? 'border-ink text-ink' : 'border-transparent text-ink-faint hover:text-ink'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === 'Overview' && <Overview />}
        {tab === 'Users' && <Users />}
        {tab === 'Feedback' && <Feedback />}
      </div>
    </div>
  );
}
