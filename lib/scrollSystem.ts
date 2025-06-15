import Lenis from 'lenis';
import { useSiteStore } from '@/store/useSiteStore';

let lenis: Lenis | null = null;
let rafId: number | null = null;

export function initScrollSystem(): void {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
  });

  function raf(time: number) {
    lenis!.raf(time);
    const scrollT =
      lenis!.scroll /
      Math.max(1, document.body.scrollHeight - window.innerHeight);
    useSiteStore.getState().setScrollT(Math.min(1, Math.max(0, scrollT)));
    rafId = requestAnimationFrame(raf);
  }

  rafId = requestAnimationFrame(raf);
}

export function destroyScrollSystem(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  if (lenis) lenis.destroy();
  lenis = null;
  rafId = null;
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
