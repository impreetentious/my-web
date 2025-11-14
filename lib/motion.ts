import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

/**
 * Returns true if the user has NOT requested reduced motion.
 * Use before every GSAP call:
 *
 *   if (motionAllowed()) {
 *     gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1 });
 *   } else {
 *     gsap.set(ref.current, { opacity: 1 });
 *   }
 */
export function motionAllowed(): boolean {
  if (typeof window === 'undefined') return true;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── House motion system ────────────────────────────────────────────────────
// One easing/duration vocabulary for the whole site. Nothing animates with
// library defaults: entrances ride ARRIVE (fast in, long soft settle), exits
// ride CUT (commit and go), and grouped reveals share the 60ms stagger.

/** Signature arrival: covers most of the distance early, then settles long. */
export const EASE_ARRIVE = CustomEase.create('descent-arrive', 'M0,0 C0.16,0.84 0.24,1 1,1');

/** Signature exit: gathers speed and leaves — no lingering tail. */
export const EASE_CUT = CustomEase.create('descent-cut', 'M0,0 C0.5,0 0.74,0.22 1,1');

/** CSS twin of ARRIVE for plain transitions (hover states etc.). */
export const EASE_ARRIVE_CSS = 'cubic-bezier(0.16, 0.84, 0.24, 1)';

/** The house stagger rhythm, seconds. */
export const STAGGER = 0.06;
