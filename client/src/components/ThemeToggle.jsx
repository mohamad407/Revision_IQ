import { useState } from 'react';

const KEY = 'riq-theme';

export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light');
    } catch {
      /* private mode: theme just won't persist */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex-shrink-0 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink ${className}`}
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}
