'use client';

import { useSyncExternalStore } from 'react';
import { MOBILE_BREAKPOINT_PX } from '@/config/world';

// One breakpoint, one source: config/world.ts (B10). The CSS side of the same
// split lives in styles/globals.css as `@media (max-width: 767px)` — if the
// constant moves, move those media queries with it.
const QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

/** Synchronous matchMedia read for non-React callers (quality probe). */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/** True below the mobile breakpoint. useSyncExternalStore keeps hydration
 *  honest (A8): the hydration render matches the server snapshot (false),
 *  then React re-renders with the real matchMedia value BEFORE paint — the
 *  desktop component tree never reaches a phone's screen. Anything that
 *  affects LAYOUT should not use this at all: put it in CSS behind the
 *  media query so the pre-hydration paint is already right. */
export function useMobile(): boolean {
  return useSyncExternalStore(subscribe, isMobileViewport, () => false);
}
