import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';

const STARTERS = ['Explain the main idea in simple words', 'What are the key definitions?', 'What is most likely to be asked in an exam?'];

export default function DocChat({ docId }) {
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', text, found? }
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, sending]);

  const send = async (question) => {
    const q = question.trim();
    if (!q || sending) return;
    setError('');
    setInput('');
    const history = messages.slice(-6).map(({ role, text }) => ({ role, text }));
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setSending(true);
    try {
      const { data } = await api.post(`/documents/${docId}/chat`, { question: q, history });
      setMessages((m) => [...m, { role: 'assistant', text: data.data.answer, found: data.data.found }]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not get an answer. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-8 rounded-sm border border-paper-line bg-paper-card p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Ask your document</p>
      <h2 className="mt-2 font-display text-xl font-medium text-ink">Chat with your notes</h2>
      <p className="mt-1 text-sm text-ink-faint">Answers come only from this document, so you can trust them for revision.</p>

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-paper-line px-3 py-1.5 text-xs text-ink hover:border-ink">
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-sm px-3 py-2 text-sm ${
                  m.role === 'user' ? 'bg-ink text-paper' : m.found === false ? 'bg-highlighter/15 text-ink' : 'bg-paper text-ink'
                }`}
              >
                {m.text}
                {m.role === 'assistant' && m.found === false && (
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-ink-faint">Not found in your notes</span>
                )}
              </div>
            </div>
          ))}
          {sending && <div className="h-8 w-24 animate-pulse rounded-sm bg-paper-line" />}
          <div ref={endRef} />
        </div>
      )}

      {error && <p className="mt-3 rounded-sm bg-flag/10 px-3 py-2 text-sm text-flag" role="alert">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          className="field-line flex-1"
          placeholder="Ask a question about this document…"
          value={input}
          maxLength={500}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Your question"
        />
        <button type="submit" className="btn-primary w-auto px-5" disabled={sending || input.trim().length < 2}>
          {sending ? '…' : 'Ask'}
        </button>
      </form>
    </section>
  );
}
