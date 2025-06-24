'use client';

import { useEffect, useRef, useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { depthReading } from '@/lib/descent';
import { PLUNGE_EVENT } from '@/lib/journey';
import { scrambleText } from '@/lib/scramble';
import type { ZoneName } from '@/types';

const ZONE_LABELS: Record<ZoneName, string> = {
  sky: 'IN DESCENT',
  horizon: 'APPROACHING SURFACE',
  sea: 'BREAKING SURFACE',
  underwater: 'BELOW SEA LEVEL',
};

export default function DepthIndicator() {
  const activeZone = useSiteStore((s) => s.activeZone);
  const [displayZone, setDisplayZone] = useState<ZoneName>('sky');
  const [labelOpacity, setLabelOpacity] = useState(0.45);
  const valueRef = useRef<HTMLDivElement>(null);
  const glitchUntilRef = useRef(0);

  // Live altitude/depth readout — textContent written directly every scroll
  // frame; a React state ticker here would re-render 60×/s
  useEffect(() => {
    const apply = (t: number) => {
      if (performance.now() < glitchUntilRef.current) return; // scramble owns it
      if (valueRef.current) valueRef.current.textContent = depthReading(t);
    };
    apply(useSiteStore.getState().scrollT);
    const unsubscribe = useSiteStore.subscribe((s) => s.scrollT, apply);
    return () => unsubscribe();
  }, []);

  // The plunge hard-flips ALT → DEPTH with a glitch tick
  useEffect(() => {
    const onPlunge = () => {
      const el = valueRef.current;
      if (!el) return;
      glitchUntilRef.current = performance.now() + 420;
      el.classList.add('hud-glitch');
      scrambleText(el, () => depthReading(useSiteStore.getState().scrollT), 360);
      setTimeout(() => el.classList.remove('hud-glitch'), 420);
    };
    window.addEventListener(PLUNGE_EVENT, onPlunge);
    return () => window.removeEventListener(PLUNGE_EVENT, onPlunge);
  }, []);

  // Brief fade out → swap label → fade back in on zone change
  useEffect(() => {
    if (activeZone === displayZone) return;
    setLabelOpacity(0);
    const timeout = setTimeout(() => {
      setDisplayZone(activeZone);
      setLabelOpacity(0.45);
    }, 250);
    return () => clearTimeout(timeout);
  }, [activeZone, displayZone]);

  // A4 — the ticker lives on every device: placement and type scale are
  // CSS-resolved (.depth-indicator), smaller and tucked lower on phones.
  return (
    <div className="depth-indicator">
      <div
        ref={valueRef}
        className="depth-value"
        style={{
          letterSpacing: '0.12em',
          color: 'var(--color-text-primary)',
          opacity: 0.8,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        ALT 400 KM
      </div>
      <div
        className="depth-zone"
        style={{
          letterSpacing: '0.22em',
          color: 'var(--color-text-muted)',
          opacity: labelOpacity,
          transition: 'opacity 0.25s ease',
        }}
      >
        {ZONE_LABELS[displayZone]}
      </div>
    </div>
  );
}
