'use client';

import { useEffect, useRef, useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { MILESTONES } from '@/lib/descent';
import { totalPageHeight } from '@/lib/activeSections';
import { useMobile } from '@/lib/useMobile';

// The scale, made felt: faint right-aligned mono captions that drift past at
// their real altitudes — 400 km of sky against 4 km of water. Page-anchored
// (they belong to places, not moments) with a slight parallax so they pass
// marginally faster than the content; exact at their own altitude.

export default function AltitudeMilestones() {
  const isMobile = useMobile();
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [positions, setPositions] = useState<number[] | null>(null);

  useEffect(() => {
    if (isMobile) return;
    const compute = () => {
      const vh = window.innerHeight;
      // the scrollable span is the world height minus one viewport — the
      // same span Lenis reports as its limit
      const denom = Math.max(1, totalPageHeight - vh);
      // page-y where the caption sits mid-viewport at its scroll moment
      setPositions(MILESTONES.map((m) => m.t * denom + vh / 2));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile || !positions) return;
    const apply = (t: number) => {
      const vh = window.innerHeight;
      for (let i = 0; i < MILESTONES.length; i++) {
        const el = refs.current[i];
        if (!el) continue;
        const dt = t - MILESTONES[i].t;
        el.style.transform = `translateY(${(-dt * vh * 0.35).toFixed(1)}px)`;
        const bell = Math.max(0, 1 - Math.abs(dt) / 0.085);
        el.style.opacity = (
          Math.pow(bell, 1.4) * (MILESTONES[i].accent ? 0.85 : 0.5)
        ).toFixed(3);
      }
    };
    apply(useSiteStore.getState().scrollT);
    const unsubscribe = useSiteStore.subscribe((s) => s.scrollT, apply);
    return () => unsubscribe();
  }, [isMobile, positions]);

  if (isMobile || !positions) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {MILESTONES.map((m, i) => (
        <div
          key={m.label}
          ref={(el) => { refs.current[i] = el; }}
          style={{
            position: 'absolute',
            top: `${positions[i]}px`,
            right: '56px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.22em',
            whiteSpace: 'nowrap',
            color: m.accent ? '#E0B26E' : 'rgba(196, 212, 230, 0.9)',
            opacity: 0,
            willChange: 'opacity, transform',
          }}
        >
          <span>{m.label} — {m.reading}</span>
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '1px',
              background: 'currentColor',
              opacity: 0.7,
            }}
          />
        </div>
      ))}
    </div>
  );
}
