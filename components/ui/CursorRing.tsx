'use client';

import { useEffect, useRef, useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { motionAllowed } from '@/lib/motion';

// C14 — a restrained cursor for the descent only: a small ring trailing the
// pointer, tightening over interactives, gaining a sonar blip underwater.
// Fine pointers with motion allowed, and only after the first real move —
// touch and reduced-motion never see it; blog routes keep the system cursor.

export default function CursorRing() {
  const [active, setActive] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionAllowed()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let rafId = 0;
    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let shown = false;
    let tight = false;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        x = tx;
        y = ty;
        setActive(true);
        document.documentElement.classList.add('mw-cursor');
      }
      const el = ringRef.current;
      if (!el) return;
      const target = e.target as Element | null;
      const interactive = !!target?.closest?.(
        'a, button, [role="button"], [tabindex]:not([tabindex="-1"])',
      );
      if (interactive !== tight) {
        tight = interactive;
        el.dataset.tight = interactive ? 'true' : 'false';
      }
    };

    const onLeave = () => {
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };
    const onEnter = () => {
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      if (!shown) return;
      x += (tx - x) * 0.28;
      y += (ty - y) * 0.28;
      const el = ringRef.current;
      if (el) el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(rafId);
      document.documentElement.classList.remove('mw-cursor');
    };
  }, []);

  // sonar voice below the surface — driven by the store's zone, cheap re-render
  const underwater = useSiteStore((s) => s.activeZone === 'underwater');

  if (!active) return null;

  return (
    <div
      ref={ringRef}
      className="cursor-ring"
      data-underwater={underwater || undefined}
      aria-hidden="true"
    >
      <span className="cursor-ring-circle" />
      <span className="cursor-ring-dot" />
      {underwater && <span className="cursor-ring-sonar" />}
    </div>
  );
}
