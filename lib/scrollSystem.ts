import Lenis from 'lenis';
import { useSiteStore } from '@/store/useSiteStore';
import { CROSS_T, smoothstep } from '@/lib/descent';
import { journey, firePlunge, fireIdleBeat } from '@/lib/journey';
import { motionAllowed } from '@/lib/motion';

let lenis: Lenis | null = null;
let rafId: number | null = null;
let teardownExtras: (() => void) | null = null;

// §3.5.2 — scroll has physics. Light and fast in orbit, heavy and damped
// underwater; lerped every frame, never stepped, so the medium change is felt
// in the hand before the eyes name it.
//
// A6 (touch): phones keep NATIVE touch scrolling — Lenis syncTouch fights the
// iOS rubber-band and can't be tuned blind from here. Lenis still tracks the
// native scroll every raf, so velocity/scrollT stay truthful; the medium
// change on touch is delivered visually instead — the comet's screen position
// drags underwater (MobileSpine) and the shader's wake response deepens.
const DURATION_ORBIT = 1.1;
const DURATION_ABYSS = 1.9;
const WHEEL_ORBIT = 1.0;
const WHEEL_ABYSS = 0.62;

const IDLE_AFTER_MS = 20000; // §3.5.6 — idle life
const IDLE_REPEAT_MS = 26000;
const PLUNGE_THROTTLE_MS = 1500;

function nativeLimit(): number {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

/** The scrollable extent every scroll-t consumer must normalise against —
 *  Lenis's own limit while it runs, the native document extent otherwise
 *  (reduced motion). Never raw scrollHeight−vh in Lenis mode: late-injected
 *  overlays (dev tools) pad the body past the scrollable extent (B9). */
export function getScrollLimit(): number {
  if (lenis && lenis.limit) return lenis.limit;
  return nativeLimit();
}

export function initScrollSystem(): void {
  // B2 — reduced motion reduces the SCROLL itself: no Lenis, no smoothing,
  // no plunge shock, no idle beats. Scrolling is native/instant; the world
  // stays truthful through a passive scroll listener so telemetry, colour
  // and geometry still belong to the place the visitor is at.
  if (!motionAllowed()) {
    const onScroll = () => {
      const t = Math.min(1, Math.max(0, window.scrollY / nativeLimit()));
      useSiteStore.getState().setScrollT(t);
      if (journey.startedAt === null && t > 0.004) {
        journey.startedAt = performance.now();
      }
      if (t > journey.maxT) journey.maxT = t;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    teardownExtras = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    return;
  }

  lenis = new Lenis({
    duration: DURATION_ORBIT,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: WHEEL_ORBIT,
  });

  let prevT = 0;
  let duration = DURATION_ORBIT;
  let wheel = WHEEL_ORBIT;
  journey.lastInputAt = performance.now();

  function raf(time: number) {
    lenis!.raf(time);
    // normalise against Lenis's own limit — body.scrollHeight over-reports
    // when late-injected overlays (dev tools) pad it past the scrollable
    // extent, which capped t below 1 at the seafloor
    const scrollLimit = lenis!.limit || document.body.scrollHeight - window.innerHeight;
    const scrollT = Math.min(1, Math.max(0, lenis!.scroll / Math.max(1, scrollLimit)));
    useSiteStore.getState().setScrollT(scrollT);

    const now = performance.now();

    // smoothed velocity + eased mouse for the shader/spine layers
    journey.velocity += (lenis!.velocity - journey.velocity) * 0.12;
    journey.mouseX += (journey.rawMouseX - journey.mouseX) * 0.055;
    journey.mouseY += (journey.rawMouseY - journey.mouseY) * 0.055;

    // mission clock + travelled distance
    if (journey.startedAt === null && scrollT > 0.004) journey.startedAt = now;
    if (scrollT > journey.maxT) journey.maxT = scrollT;

    // water weight — lerp Lenis params toward the zone target. F2: same
    // crossing-anchored gate as MobileSpine's underwater drag (was 0.7/0.85,
    // tied to the old 0.76 world).
    const uw = smoothstep(CROSS_T - 0.06, CROSS_T + 0.09, scrollT);
    duration += (DURATION_ORBIT + (DURATION_ABYSS - DURATION_ORBIT) * uw - duration) * 0.08;
    wheel += (WHEEL_ORBIT + (WHEEL_ABYSS - WHEEL_ORBIT) * uw - wheel) * 0.08;
    lenis!.options.duration = duration;
    lenis!.options.wheelMultiplier = wheel;

    // the plunge — one-shot on downward crossing, re-armed above it
    if (!journey.plungeArmed && scrollT < CROSS_T - 0.02) {
      journey.plungeArmed = true;
    }
    if (
      journey.plungeArmed &&
      prevT < CROSS_T &&
      scrollT >= CROSS_T &&
      now - journey.plungeAt > PLUNGE_THROTTLE_MS
    ) {
      firePlunge(now);
    }
    prevT = scrollT;

    // idle life — a beat for whoever lingers
    if (
      now - journey.lastInputAt > IDLE_AFTER_MS &&
      now - journey.idleBeatAt > IDLE_REPEAT_MS &&
      !useSiteStore.getState().isLoading
    ) {
      fireIdleBeat(now);
    }

    rafId = requestAnimationFrame(raf);
  }

  // B4 — a hidden tab gets no scroll loop at all; on return, zero the
  // velocity and idle clock so the away-time doesn't integrate into one
  // spike or an instant idle beat.
  const onVisibility = () => {
    if (document.hidden) {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (rafId === null) {
      journey.velocity = 0;
      journey.lastInputAt = performance.now();
      rafId = requestAnimationFrame(raf);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  teardownExtras = () => document.removeEventListener('visibilitychange', onVisibility);

  rafId = requestAnimationFrame(raf);
}

export function destroyScrollSystem(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  teardownExtras?.();
  if (lenis) lenis.destroy();
  lenis = null;
  rafId = null;
  teardownExtras = null;
}

export function scrollToY(y: number): void {
  if (lenis) lenis.scrollTo(y);
  else window.scrollTo({ top: y });
}

export function stopScroll(): void {
  lenis?.stop();
}

export function startScroll(): void {
  lenis?.start();
}
