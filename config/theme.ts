export const COLORS = {
  accent:              '#00FFEE',
  accentDim:           'rgba(0, 255, 238, 0.3)',
  accentBorder:        'rgba(0, 255, 238, 0.2)',
  accentBorderHover:   'rgba(0, 255, 238, 0.7)',

  background:          '#080808',
  surface:             '#111111',
  elevated:            '#1A1A1A',

  textPrimary:         '#F2F2F2',
  textSecondary:       '#888888',
  textMuted:           '#808080',

  borderSubtle:        'rgba(255, 255, 255, 0.08)',
  borderVisible:       'rgba(255, 255, 255, 0.15)',

  spineBase:           '#1C1C1C',
  spinePulse:          '#00FFEE',
  spineProgress:       '#00FFEE',

  // Three.js expects hex numbers, not strings
  bgThree:             0x080808,
  accentThree:         0x00FFEE,
  fogThree:            0x080808,
} as const;
