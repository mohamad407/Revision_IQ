/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Colours come from CSS variables (see index.css) so a `.dark` class can re-theme the app.
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
          line: 'rgb(var(--paper-line) / <alpha-value>)',
          card: 'rgb(var(--paper-card) / <alpha-value>)',
        },
        highlighter: {
          DEFAULT: '#FFC94A',
          deep: '#F0A824',
        },
        correct: 'rgb(var(--correct) / <alpha-value>)',
        flag: 'rgb(var(--flag) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'notebook-lines':
          'repeating-linear-gradient(to bottom, transparent, transparent 27px, rgb(var(--paper-line)) 28px)',
      },
    },
  },
  plugins: [],
};
