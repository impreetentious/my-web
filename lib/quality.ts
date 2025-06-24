import { useSiteStore } from '@/store/useSiteStore';
import { isMobileViewport } from '@/lib/useMobile';
import type { QualityLevel } from '@/types';

// B3/A2 — the render-tier system behind the store's `quality` field:
//   high   — full shader world, native dpr (capped 2). Desktop default.
//   medium — same world at dpr 1 with the lite uniform set. Mobile default.
//   low    — no WebGL: the animated CSS fallback world (BackgroundGradient).
// Tiers only ever demote (fps probe, context loss) — a device that measured
// poor once doesn't get re-promoted into visible flip-flopping. The one
// exception is a RESTORED WebGL context, which returns to the probed tier.

let probed: Exclude<QualityLevel, 'low'> = 'high';
let webglOk: boolean | null = null;

export function webglSupported(): boolean {
  if (webglOk !== null) return webglOk;
  try {
    const canvas = document.createElement('canvas');
    webglOk = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webglOk = false;
  }
  return webglOk;
}

/** Capability → initial tier. Runs once on mount, before the veil lifts, so
 *  the right world (shader or CSS) is already live when the page appears. */
export function initQuality(): void {
  if (!webglSupported()) {
    useSiteStore.getState().setQuality('low');
    return;
  }
  probed = isMobileViewport() ? 'medium' : 'high';
  useSiteStore.getState().setQuality(probed);
}

/** The tier the capability probe chose — where a recovered context loss
 *  returns to. */
export function probedQuality(): Exclude<QualityLevel, 'low'> {
  return probed;
}

// ~1.2s of rAF cadence, starting a beat after the veil lifts so the hero
// entrance doesn't skew the read. A phone that can't hold the shader world
// drops a tier instead of shipping jank; a starved desktop GPU falls through
// to the CSS world.
const PROBE_DELAY_MS = 600;
const PROBE_WINDOW_MS = 1200;
const MIN_FPS_HIGH = 34;
const MIN_FPS_MEDIUM = 22;

/** One-shot fps probe (A2). Returns a cancel function. */
export function runFpsProbe(): () => void {
  let rafId = 0;
  let cancelled = false;

  const sample = () => {
    // hidden tabs throttle rAF to ~1fps — a false reading, skip entirely
    if (cancelled || document.hidden) return;
    const t0 = performance.now();
    let frames = 0;
    const tick = (now: number) => {
      if (cancelled || document.hidden) return;
      frames++;
      if (now - t0 < PROBE_WINDOW_MS) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const fps = (frames * 1000) / (now - t0);
      const { quality, setQuality } = useSiteStore.getState();
      if (quality === 'high' && fps < MIN_FPS_HIGH) {
        setQuality(fps < MIN_FPS_MEDIUM ? 'low' : 'medium');
      } else if (quality === 'medium' && fps < MIN_FPS_MEDIUM) {
        setQuality('low');
      }
    };
    rafId = requestAnimationFrame(tick);
  };

  const timeoutId = setTimeout(sample, PROBE_DELAY_MS);
  return () => {
    cancelled = true;
    clearTimeout(timeoutId);
    cancelAnimationFrame(rafId);
  };
}
