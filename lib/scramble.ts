import { motionAllowed } from '@/lib/motion';

// Decode-tick text scramble for mono meta strings ONLY — body text never
// scrambles (legibility wins). Reveals left→right, refreshing the target each
// frame via getFinal so live readings (the depth ticker) stay truthful.

const CHARS = '#%&@$+=*<>/0123456789';

export function scrambleText(el: Element, getFinal: () => string, durationMs = 320): void {
  if (!motionAllowed()) {
    el.textContent = getFinal();
    return;
  }
  const start = performance.now();
  const tick = () => {
    const finalText = getFinal();
    const p = Math.min(1, (performance.now() - start) / durationMs);
    const keep = Math.floor(finalText.length * p);
    let out = finalText.slice(0, keep);
    for (let i = keep; i < finalText.length; i++) {
      const ch = finalText[i];
      out += ch === ' ' ? ' ' : CHARS[(Math.random() * CHARS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
  };
  tick();
}
