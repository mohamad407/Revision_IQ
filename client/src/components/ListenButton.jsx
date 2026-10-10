import { useEffect, useState } from 'react';

const LANG_CODES = {
  English: 'en-IN',
  Tamil: 'ta-IN',
  Hindi: 'hi-IN',
  Telugu: 'te-IN',
  Kannada: 'kn-IN',
  Malayalam: 'ml-IN',
};

// Reads text aloud with the browser's built-in speech engine (no server, no cost).
// Hidden on browsers without speech synthesis.
export default function ListenButton({ text, language = 'English', className = '' }) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => supported && window.speechSynthesis.cancel(), [supported]);

  if (!supported || !text) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_CODES[language] || 'en-IN';
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink ${className}`}
    >
      {speaking ? '■ Stop' : '▶ Listen'}
    </button>
  );
}
