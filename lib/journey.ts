// Mutable per-frame runtime state shared between the scroll system, the SVG
// spine and the WebGL layers. Plain module fields, not zustand — these change
// every animation frame and must never trigger React work. Writers: the
// scroll raf (velocity, plunge, idle), ScrollProvider listeners (mouse,
// input), SpineSVG (comet screen position). Readers: shader useFrame loops,
// spine, HUD one-shots via the window events below.

export const journey = {
  /** Smoothed Lenis velocity, ≈ px/frame. Positive = descending. */
  velocity: 0,

  /** Eased pointer offset from viewport centre, −1..1 each axis. */
  mouseX: 0,
  mouseY: 0,
  /** Raw (unsmoothed) pointer offset — the raf eases mouseX/Y toward these. */
  rawMouseX: 0,
  rawMouseY: 0,

  /** Comet screen position in CSS px — written by SpineSVG every frame so
   *  the abyss shader and underwater particles can light around the probe. */
  cometX: 0,
  cometY: 0,
  cometOn: false,

  /** performance.now() of the last plunge; −∞ before the first. */
  plungeAt: -1e12,
  /** Re-arms when the visitor scrolls back above the crossing. */
  plungeArmed: true,

  /** Idle beats (§3.5.6): last input + last fired beat. */
  lastInputAt: 0,
  idleBeatAt: -1e12,

  /** First-scroll timestamp — mission clock zero for the footer recap. */
  startedAt: null as number | null,

  /** True when the boot sequence hands its final line off to the hero tag —
   *  the hero then crossfades that line in place instead of re-entering it. */
  heroHandoff: false,

  /** Deepest scroll t reached — distance travelled for the recap. */
  maxT: 0,
};

/** One-shot DOM notifications for systems that animate on the moment rather
 *  than per-frame (depth ticker glitch, spine spray, idle pings). */
export const PLUNGE_EVENT = 'descent:plunge';
export const IDLE_EVENT = 'descent:idle';

export function firePlunge(now: number): void {
  journey.plungeAt = now;
  journey.plungeArmed = false;
  window.dispatchEvent(new CustomEvent(PLUNGE_EVENT));
}

export function fireIdleBeat(now: number): void {
  journey.idleBeatAt = now;
  window.dispatchEvent(new CustomEvent(IDLE_EVENT));
}

/** Seconds since the last plunge (clamped) — the sky shader shapes its own
 *  flash/wobble/dip/spray envelopes from this single number. */
export function plungeElapsed(nowMs: number): number {
  return Math.min(30, (nowMs - journey.plungeAt) / 1000);
}
