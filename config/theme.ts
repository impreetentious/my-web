// NOTE: components currently hardcode their colours inline; nothing imports
// this file yet. It is kept as the canonical palette reference — keep it in
// sync with styles/globals.css and lib/descent.ts when colours change.

export const COLORS = {
  accent: '#00FFEE',
  accentDim: 'rgba(0, 255, 238, 0.3)',
  accentBorder: 'rgba(0, 255, 238, 0.2)',
  accentBorderHover: 'rgba(0, 255, 238, 0.7)',

  // World gold — used by space-zone elements (hero signal, waterline, comet
  // in orbit). v2 desaturated the candy gold; interface chrome stays cyan,
  // and pure cyan survives only as tiny UI accents. See lib/descent.ts.
  gold: '#E0B26E',
  goldPale: '#EADCBC',

  background: '#05060D',
  surface: '#111111',
  elevated: '#1A1A1A',

  textPrimary: '#F2F2F2',
  textSecondary: '#888888',
  textMuted: '#808080',

  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderVisible: 'rgba(255, 255, 255, 0.15)',

  // Three.js expects hex numbers, not strings
  bgThree: 0x05060d,
  accentThree: 0x00ffee,
} as const;
