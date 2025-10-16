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

// high > medium > low. Used to enforce the demote-only rule everywhere a
// runtime signal (fps, battery, field vitals) wants to lower the tier.
const RANK: Record<QualityLevel, number> = { low: 0, medium: 1, high: 2 };

/** Lower the render tier toward `ceiling`, never raise it. The one place any
 *  runtime demotion goes through, so the B3 invariant ("a device that showed
 *  strain doesn't get re-promoted into visible flip-flopping") holds for the
 *  fps probe, the battery check, and the field-vitals monitor alike. */
export function capQuality(ceiling: QualityLevel): void {
  const { quality, setQuality } = useSiteStore.getState();
  if (RANK[ceiling] < RANK[quality]) setQuality(ceiling);
}

// A2b — the network's own hint. Save-Data ("reduce my data") and 2G-class
// links have no business downloading the shader world; 3G caps the desktop
// default to the lite uniform set. `navigator.connection` is not in the TS DOM
// lib, so the shape is declared locally and read behind a guard.
interface NetworkInformationLike {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
}
function connectionCeiling(): QualityLevel | null {
  const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (!conn) return null;
  if (conn.saveData) return 'low';
  switch (conn.effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'low';
    case '3g':
      return 'medium';
    default:
      return null; // 4g / unknown — no cap
  }
}

// A2c — battery is a soft, runtime signal, so (unlike the connection ceiling)
// it never rewrites `probed`: a device that gets plugged in and restores its
// WebGL context still returns to the capability tier. It only ever demotes the
// live tier. getBattery() is Promise-based and absent on many browsers, so the
// whole thing is a guarded, one-shot best-effort (mirrors the fps probe).
interface BatteryManagerLike {
  level: number; // 0..1
  charging: boolean;
}
function scheduleBatteryCheck(): void {
  const getBattery = (navigator as Navigator & {
    getBattery?: () => Promise<BatteryManagerLike>;
  }).getBattery;
  if (typeof getBattery !== 'function') return;
  getBattery
    .call(navigator)
    .then((battery) => {
      if (battery.charging) return; // plugged in — spend the pixels
      if (battery.level <= 0.15) capQuality('low'); // nearly flat → CSS world
      else if (battery.level <= 0.3) capQuality('medium'); // low → lite set
    })
    .catch(() => {
      // battery API blocked/rejected — no cap, nothing breaks
    });
}

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
  // A Save-Data or 2G-class hint drops WebGL entirely — same outcome as no
  // WebGL support, the CSS fallback world — so it short-circuits like one.
  const ceiling = connectionCeiling();
  if (ceiling === 'low') {
    useSiteStore.getState().setQuality('low');
    return;
  }
  probed = isMobileViewport() ? 'medium' : 'high';
  // A 3G link caps the desktop 'high' default to the mobile-lite set. This is
  // baked into `probed` (not a live demote) so a restored context honours it.
  if (ceiling === 'medium' && probed === 'high') probed = 'medium';
  useSiteStore.getState().setQuality(probed);
  scheduleBatteryCheck();
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
