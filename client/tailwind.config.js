/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#16213A',
          soft: '#2A3752',
          faint: '#5B6885',
        },
        paper: {
          DEFAULT: '#F4F6F5',
          line: '#E1E6E3',
          card: '#FFFFFF',
        },
        highlighter: {
          DEFAULT: '#FFC94A',
          deep: '#F0A824',
        },
        correct: '#3E8E7E',
        flag: '#C4483A',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'notebook-lines':
          'repeating-linear-gradient(to bottom, transparent, transparent 27px, #E1E6E3 28px)',
      },
    },
  },
  plugins: [],
};
