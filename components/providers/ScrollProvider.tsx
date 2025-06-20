'use client';

import { useEffect } from 'react';
import { initScrollSystem, destroyScrollSystem } from '@/lib/scrollSystem';
import { journey } from '@/lib/journey';

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initScrollSystem();

    // Feed the shared runtime state: pointer for the ±6px parallax layers,
    // any input for the idle-life timer. Raw values only — the scroll raf
    // does the easing so every consumer sees the same smoothed signal.
    const onMouseMove = (e: MouseEvent) => {
      journey.rawMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      journey.rawMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      journey.lastInputAt = performance.now();
    };
    const onInput = () => {
      journey.lastInputAt = performance.now();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('wheel', onInput, { passive: true });
    window.addEventListener('keydown', onInput);
    window.addEventListener('touchstart', onInput, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onInput);
      window.removeEventListener('keydown', onInput);
      window.removeEventListener('touchstart', onInput);
      destroyScrollSystem();
    };
  }, []);

  return <>{children}</>;
}
