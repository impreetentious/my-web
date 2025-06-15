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
