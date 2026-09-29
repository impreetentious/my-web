import type { Config } from 'tailwindcss';

// Color tokens live as CSS variables in styles/globals.css (consumed via
// var(--color-*)). This config exposes only the font aliases set by next/font.
const config: Config = {
  // A path missing from this list silently drops its classes from the build.
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
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
