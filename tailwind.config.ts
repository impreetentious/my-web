import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#00FFEE',
        bg: '#080808',
        surface: '#111111',
        elevated: '#1A1A1A',
        'text-primary': '#F2F2F2',
        'text-secondary': '#888888',
        'text-muted': '#808080',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
