// The descent timing + colour system: one vertical journey from orbit to the
// ocean floor. Every scroll-driven visual (sky shader, spine trail, comet,
// depth ticker, waterline) samples this module so the world stays in one
// story. v2 moves the waterline crossing to t = CROSS_T (derived, ~0.84 at the
// 5-card default) so the sky reads as ~¾+ of the journey — a 400 km fall
// against a 4 km dive.
//
// "u" below is normalised page depth (y / totalHeight), NOT scrollT — colours
// belong to places in the world, not to moments in time. scrollT-based helpers
// are labelled with "t".

import { activeSections, totalPageHeight } from '@/lib/activeSections';
import { SECTION_HEIGHT_PX, HEADER_HEIGHT_PX } from '@/config/world';

// ─── The plunge moment (derived — F2) ───────────────────────────────────────
// CROSS_T is no longer hand-tuned to a 4-card page: it derives from the
// enabled section count so both placeholder states (5 or 6 cards) land the
// crossing in the GAP between the last two cards. Every scroll-t literal in
// this file, the shader, the audio mix and the mobile spine is re-expressed
// relative to CROSS_T / U_SURFACE / K so the whole world stretches with it.

/** Viewport height the tuning is normalised to. Real viewports (700–1100px)
 *  drift the card/crossing alignment ±0.02 t — the same slop as the old
 *  hand-tuned world. */
const NOMINAL_VH = 900;

const N = activeSections.length;
const limit = totalPageHeight - NOMINAL_VH;

/** scroll-t at which card i sits screen-centred (nominal viewport). */
const tCard = (i: number): number =>
  (HEADER_HEIGHT_PX + i * SECTION_HEIGHT_PX + SECTION_HEIGHT_PX / 2 - NOMINAL_VH / 2) /
  limit;

/** Scroll moment the comet pierces the waterline, mid-viewport. The crossing
 *  lands between the last two cards — everything above the waterline except
 *  the final (contact) transmission. */
export const CROSS_T = Math.min(0.88, (tCard(N - 2) + tCard(N - 1)) / 2);

/** Approximate page depth (u) of the surface — viewport-centre depth at the
 *  crossing. Positions the trail gradient's warm→cool handover (which blends
 *  over ±0.035 u and absorbs the viewport error) and the shader's u-space
 *  gates. */
export const U_SURFACE = (CROSS_T * limit + NOMINAL_VH / 2) / totalPageHeight;

/** Sky-stretch factor: early-journey beats scale with the longer sky. The
 *  0.76 anchor is the old hand-tuned crossing the literals were authored at. */
export const K = CROSS_T / 0.76;

/** Scroll-t zone boundaries (moved out of config/world.ts in F2 so they can
 *  derive from CROSS_T — config/world must not import descent). Consumed by
 *  store/useSiteStore to label the active zone. */
export const ZONE_THRESHOLDS = {
  sky: 0,                       // always starts here
  horizon: CROSS_T - 0.26,      // golden-hour descent, sea visible below
  sea: CROSS_T - 0.04,          // breaking the surface
  underwater: CROSS_T + 0.04,   // below it
} as const;

// ─── Trail gradient (gold in space → amber at the surface → teal below) ────

export interface TrailStop {
  u: number;      // 0 = top of page, 1 = bottom
  color: string;  // hex
}

// v2 palette: desaturated against v1's candy gold/cyan. The handover brackets
// U_SURFACE so each part of the wake keeps the light of the altitude where it
// was made. Pure #00FFEE survives only as tiny UI accents, never here.
export const TRAIL_STOPS: TrailStop[] = [
  { u: 0.0,  color: '#EADCBC' },  // pale starlight gold
  { u: 0.34, color: '#DDB878' },  // gold
  { u: U_SURFACE - 0.035, color: '#CE9A5E' },  // amber — at the surface
  { u: U_SURFACE + 0.035, color: '#7FC4B8' },  // aqua — just under it
  { u: 0.86, color: '#3FA898' },  // dim teal
  { u: 1.0,  color: '#2E7D95' },  // deep-water blue
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Colour of the trail/world at page depth u ∈ [0,1], as a CSS rgb() string. */
export function trailColorAt(u: number): string {
  const clamped = Math.min(1, Math.max(0, u));
  let a = TRAIL_STOPS[0];
  let b = TRAIL_STOPS[TRAIL_STOPS.length - 1];
  for (let i = 0; i < TRAIL_STOPS.length - 1; i++) {
    if (clamped >= TRAIL_STOPS[i].u && clamped <= TRAIL_STOPS[i + 1].u) {
      a = TRAIL_STOPS[i];
      b = TRAIL_STOPS[i + 1];
      break;
    }
  }
  const span = b.u - a.u || 1;
  const f = (clamped - a.u) / span;
  const [r1, g1, b1] = hexToRgb(a.color);
  const [r2, g2, b2] = hexToRgb(b.color);
  return `rgb(${Math.round(r1 + (r2 - r1) * f)}, ${Math.round(
    g1 + (g2 - g1) * f
  )}, ${Math.round(b1 + (b2 - b1) * f)})`;
}

// ─── Easing primitives ──────────────────────────────────────────────────────

/** 0→1 with smooth ends. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const s = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return s * s * (3 - 2 * s);
}

/** Linear ramp 0→1 between edges, clamped. */
export function ramp(edge0: number, edge1: number, x: number): number {
  return Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
}

/** Monotone cubic hermite (Fritsch–Carlson) through (xs, ys). C1-smooth and
 *  overshoot-free — used for choreographed curves where per-segment
 *  smoothstep would stall to zero velocity at every knot. */
function monotoneCurve(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i]);
    m.push((ys[i + 1] - ys[i]) / dx[i]);
  }
  const c1: number[] = new Array(n).fill(0);
  c1[0] = m[0];
  c1[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) c1[i] = 0;
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      c1[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = dx[i];
    const s = (x - xs[i]) / h;
    const s1 = 1 - s;
    return (
      (1 + 2 * s) * s1 * s1 * ys[i] +
      s * s1 * s1 * h * c1[i] +
      s * s * (3 - 2 * s) * ys[i + 1] +
      s * s * (s - 1) * h * c1[i + 1]
    );
  };
}

// ─── Waterline choreography (screen space) ──────────────────────────────────

/** Scroll span in which the line is anywhere near the frame — cheap gates for
 *  systems that only care whether the ocean is on screen at all. */
export const WATERLINE = {
  enterT: CROSS_T - 0.16,  // still fully below the viewport before this
  exitT:  CROSS_T + 0.08,  // fully above the viewport after this
} as const;

// The line's screen path: rises from far below, eases to a hover in the lower
// third (approach — not 50/50), tips forward through the plunge and sweeps up
// past the viewer. Pinned to exactly 50vh at CROSS_T so the comet — remapped
// to mid-viewport at that moment (cometProgress) — pierces it on the beat.
const waterlineCurve = monotoneCurve(
  [
    CROSS_T - 0.26, CROSS_T - 0.16, CROSS_T - 0.115, CROSS_T - 0.08,
    CROSS_T - 0.04, CROSS_T - 0.015, CROSS_T, CROSS_T + 0.02,
    CROSS_T + 0.04, CROSS_T + 0.08,
  ],
  [175, 118, 86, 70, 63, 57, 50, 18, -25, -85]
);

/** Waterline screen position at scroll t, in vh from the top of the viewport.
 *  Continuous beyond the frame (>100 below, <0 above) so shader glow can
 *  build before the line itself enters. */
export function waterlineScreenVh(t: number): number {
  return waterlineCurve(t);
}

// ─── Comet screen trajectory ────────────────────────────────────────────────

/** Comet screen position at scroll t, in vh from the top of the viewport.
 *
 *  With pure arc-length tracking the comet's screen-y is ≈ t·100vh, which
 *  would put it at 76vh — not mid-viewport — at the new crossing. So the
 *  probe decelerates as the surface approaches (the visitor catches up to
 *  it), meets the line at exactly 50vh at CROSS_T, then pulls ahead again
 *  in the deep and settles ~84vh at the seafloor.
 *
 *  Defined in SCREEN space and anchored to live window.scrollY by the caller
 *  (pageY = scrollY + vh·this/100) rather than projected through page space —
 *  page-space projection assumes scrollY = t·(pageHeight − vh), which the
 *  dev overlay's extra body height quietly breaks. */
export function cometScreenVh(t: number): number {
  const rise = smoothstep(K * 0.28, CROSS_T, t);
  const fall = 1 - 0.4 * smoothstep(CROSS_T, 1.0, t);
  return 100 * (t - (CROSS_T - 0.5) * rise * fall);
}

/** Mobile comet screen path (A3), in vh from the top of the viewport. The
 *  probe hovers in the upper third while the sky is young, meets the
 *  waterline mid-frame at CROSS_T — the plunge beat is shared with desktop —
 *  then pulls ahead into the lower third across the deep. */
export function cometScreenVhMobile(t: number): number {
  return (
    12 +
    26 * smoothstep(0.0, K * 0.3, t) +
    12 * smoothstep(CROSS_T - 0.24, CROSS_T, t) +
    22 * smoothstep(CROSS_T, 1.0, t)
  );
}

// ─── Zone weights (t-space) ─────────────────────────────────────────────────

/** Opacity of each background/particle layer at scroll t. Weights are
 *  independent (layers stack back-to-front), not a partition of unity.
 *  v2 beats (now parametric — F2): early-sky beats scale by K, the crossing
 *  band and everything below anchor to CROSS_T; orbit/high-atmosphere occupy
 *  the fixed upper sky, golden hour → crossing → underwater track the surface. */
export function zoneWeights(t: number): {
  space: number;
  dusk: number;
  sea: number;
  abyss: number;
  rays: number;
  stars: number;
  underwater: number;
} {
  return {
    space: 1 - smoothstep(K * 0.30, K * 0.55, t),
    dusk: smoothstep(K * 0.28, K * 0.52, t) * (1 - smoothstep(CROSS_T - 0.08, CROSS_T + 0.02, t)),
    sea: smoothstep(CROSS_T - 0.06, CROSS_T + 0.02, t) * (1 - smoothstep(CROSS_T + 0.09, 0.97, t)),
    abyss: smoothstep(CROSS_T + 0.08, 0.97, t),
    rays: smoothstep(CROSS_T, CROSS_T + 0.08, t) * (1 - 0.75 * smoothstep(CROSS_T + 0.12, 0.985, t)),
    stars: 1 - smoothstep(K * 0.55, K * 0.70, t),
    underwater: smoothstep(CROSS_T - 0.02, CROSS_T + 0.06, t),
  };
}

/** How dead the ambient light is (0 = lit world, 1 = abyss where the comet is
 *  the only light). Shared by the sky shader and the underwater particles so
 *  the falloff around the probe matches everywhere. */
export function abyssGate(t: number): number {
  return smoothstep(CROSS_T + 0.08, CROSS_T + 0.17, t);
}

// ─── Altitude / depth model ─────────────────────────────────────────────────

const ORBIT_KM = 400;   // start at ISS altitude
const FLOOR_M = 3800;   // average ocean depth

/** Altitude hits zero here… */
export const SEA_T0 = CROSS_T - 0.025;
/** …and depth leaves zero here; between them the ticker reads SEA LEVEL
 *  until the plunge hard-flips it to DEPTH. */
export const DEPTH_T0 = CROSS_T + 0.005;

const ALT_EXP = 3.2;   // log-ish: early kilometres fly past, low ones crawl
const DEPTH_EXP = 1.6;

export function altitudeKm(t: number): number {
  const x = ramp(0.02, SEA_T0, t);
  return ORBIT_KM * Math.pow(1 - x, ALT_EXP);
}

export function depthMetres(t: number): number {
  const x = ramp(DEPTH_T0, 1, t);
  return FLOOR_M * Math.pow(x, DEPTH_EXP);
}

/** Inverse of altitudeKm — scroll t at which the reading passes `km`. */
export function tAtAltitudeKm(km: number): number {
  const x = 1 - Math.pow(km / ORBIT_KM, 1 / ALT_EXP);
  return 0.02 + x * (SEA_T0 - 0.02);
}

/** Inverse of depthMetres — scroll t at which the reading passes `m` below. */
export function tAtDepthM(m: number): number {
  const x = Math.pow(m / FLOOR_M, 1 / DEPTH_EXP);
  return DEPTH_T0 + x * (1 - DEPTH_T0);
}

/** Human-readable altitude/depth reading for the HUD at scroll t. The flip
 *  from ALT to DEPTH happens exactly at CROSS_T — the plunge owns it. */
export function depthReading(t: number): string {
  if (t < CROSS_T) {
    const km = altitudeKm(t);
    if (km >= 10) return `ALT ${Math.round(km).toLocaleString('en-US')} KM`;
    if (km >= 1) return `ALT ${km.toFixed(1)} KM`;
    const m = Math.round(km * 1000);
    if (m >= 5) return `ALT ${m.toLocaleString('en-US')} M`;
    return 'SEA LEVEL';
  }
  const m = Math.round(depthMetres(t));
  return `DEPTH −${m.toLocaleString('en-US')} M`;
}

// ─── Altitude milestones (the scale, made felt) ─────────────────────────────

export interface Milestone {
  label: string;    // 'KÁRMÁN LINE'
  reading: string;  // '100 KM'
  t: number;        // scroll moment the caption is at its true altitude
  accent?: boolean; // sea level gets the gold
  /** Opacity bell half-width in t (default 0.085). Narrowed where milestones
   *  cluster around the crossing so at most one caption is prominent near
   *  the plunge (B8) — the set piece stays uncrowded. */
  bell?: number;
  /** Survives the mobile cut (A4) — phones show only the landmark trio. */
  core?: boolean;
}

export const MILESTONES: Milestone[] = [
  { label: 'KÁRMÁN LINE', reading: '100 KM', t: tAtAltitudeKm(100), core: true },
  { label: 'METEOR LAYER', reading: '80 KM', t: tAtAltitudeKm(80) },
  { label: 'CRUISING ALTITUDE', reading: '11 KM', t: tAtAltitudeKm(11) },
  { label: 'CLOUD DECK', reading: '2 KM', t: tAtAltitudeKm(2) },
  { label: 'SEA LEVEL', reading: '0 M', t: CROSS_T - 0.012, accent: true, bell: 0.03, core: true },
  { label: 'PHOTIC LIMIT', reading: '−200 M', t: tAtDepthM(200), bell: 0.03 },
  // Bell tightened so the caption marks the arrival then yields — at full
  // rest (t=1) it has faded instead of sitting lit over the footer recap.
  { label: 'ABYSSAL PLAIN', reading: '−3,800 M', t: 0.985, bell: 0.016, core: true },
];
