'use client';

import { useEffect, useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { useMobile } from '@/lib/useMobile';
import type { ZoneName } from '@/types';

const ZONE_LABELS: Record<ZoneName, string> = {
  sky: '— ABOVE SEA LEVEL —',
  horizon: '— SEA LEVEL —',
  sea: '— SURFACE —',
  underwater: '— BELOW SEA LEVEL —',
};

export default function DepthIndicator() {
  const isMobile = useMobile();
  const activeZone = useSiteStore((s) => s.activeZone);
  const [displayZone, setDisplayZone] = useState<ZoneName>('sky');
  const [opacity, setOpacity] = useState(0.4);

  // Brief fade out → swap label → fade back in on zone change
  useEffect(() => {
    if (activeZone === displayZone) return;
    setOpacity(0);
    const timeout = setTimeout(() => {
      setDisplayZone(activeZone);
      setOpacity(0.4);
    }, 200);
    return () => clearTimeout(timeout);
  }, [activeZone, displayZone]);

  if (isMobile) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '28px',
        zIndex: 10,
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        letterSpacing: '0.15em',
        color: 'var(--color-text-muted)',
        opacity,
        transition: 'opacity 0.4s ease',
      }}
    >
      {ZONE_LABELS[displayZone]}
    </div>
  );
}
