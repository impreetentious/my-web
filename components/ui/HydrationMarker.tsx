'use client';

import { useEffect } from 'react';

// Hydration fail-open marker: layout's early inline script starts a timer;
// this component clears it by stamping data-hydrated once React mounts.
export default function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = '1';
  }, []);
  return null;
}
