import type { Config } from 'tailwindcss';

// Color tokens live as CSS variables in styles/globals.css (consumed via
// var(--color-*)). Tailwind utilities for accent/surface/text-* were unused
// and removed in the dead-CSS pass — keep only the font aliases next/font sets.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
