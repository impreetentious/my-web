import { capQuality } from '@/lib/quality';
import { trackVital, type VitalName, type VitalRating } from '@/lib/analytics';

// field Core Web Vitals, measured in the real session with the platform
// PerformanceObserver rather than another runtime dependency. Two jobs:
//
//   • telemetry — LCP, CLS and an INP-lite are reported once, on page hide,
//     through the cookieless Vercel `track` (lib/analytics.trackVital).
//   • tier demotion — a live poor signal (a very late LCP, an accumulating
//     layout shift, a janky interaction) caps the render tier through the same
//     demote-only path the fps probe uses. Real strain, not just a synthetic
//     fps window, feeds the quality system.
//
// Thresholds are Google's field boundaries [good, poor]. CLS is unitless; LCP
// and INP are milliseconds.
const THRESHOLDS: Record<VitalName, [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
};

function rate(metric: VitalName, value: number): VitalRating {
  const [good, poor] = THRESHOLDS[metric];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

// These entry shapes are not all present in the TS DOM lib, so the extra
// fields are declared locally and read off the base PerformanceEntry.
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

/** Start the field-vitals monitor. Returns a cleanup that disconnects every
 *  observer and removes the page-hide listeners. No-op (returns a noop) when
 *  the APIs are unavailable — old browsers, or SSR. */
export function initWebVitals(): () => void {
  if (typeof PerformanceObserver === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let lcp = 0;
  let cls = 0;
  let inp = 0;

  // CLS session-window accumulation (the algorithm web-vitals uses): a new
  // window starts after a >1s gap or once the window spans >5s; CLS is the
  // largest window total.
  let winValue = 0;
  let winFirst = 0;
  let winLast = 0;

  let demoted = false;
  const demote = () => {
    if (demoted) return;
    demoted = true;
    capQuality('medium'); // a struggling device drops to the lite set, once
  };

  const observers: Array<{
    observer: PerformanceObserver;
    process: (entries: PerformanceEntry[]) => void;
  }> = [];
  const observe = (
    type: string,
    cb: (entries: PerformanceEntry[]) => void,
    opts: PerformanceObserverInit = {},
  ): boolean => {
    try {
      const po = new PerformanceObserver((list) => cb(list.getEntries()));
      po.observe({ type, buffered: true, ...opts });
      observers.push({ observer: po, process: cb });
      return true;
    } catch {
      // this entry type isn't supported here — skip it, keep the others
      return false;
    }
  };

  const observesLcp = observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1];
    if (last) lcp = last.startTime;
    if (lcp > THRESHOLDS.LCP[1]) demote();
  });

  const observesCls = observe('layout-shift', (entries) => {
    for (const raw of entries) {
      const e = raw as LayoutShiftEntry;
      if (e.hadRecentInput) continue; // shifts within 500ms of input don't count
      if (winValue && (e.startTime - winLast > 1000 || e.startTime - winFirst > 5000)) {
        winValue = 0;
      }
      if (!winValue) winFirst = e.startTime;
      winLast = e.startTime;
      winValue += e.value;
      cls = Math.max(cls, winValue);
    }
    if (cls > THRESHOLDS.CLS[1]) demote();
  });

  // INP-lite: the worst interaction latency seen (real INP is the ~98th
  // percentile of interactions; the max is a cheap, honest upper bound). The
  // durationThreshold keeps trivial events out of the buffer.
  observe(
    'event',
    (entries) => {
      for (const e of entries) inp = Math.max(inp, (e as PerformanceEventTiming).duration);
      if (inp > THRESHOLDS.INP[1]) demote();
    },
    { durationThreshold: 40 } as PerformanceObserverInit,
  );

  let reported = false;
  const report = () => {
    if (reported) return;
    reported = true;
    for (const { observer, process } of observers) {
      const pending = observer.takeRecords();
      if (pending.length > 0) process(pending);
    }
    if (observesLcp && lcp > 0) trackVital('LCP', lcp, rate('LCP', lcp));
    if (observesCls) trackVital('CLS', cls, rate('CLS', cls));
    if (inp > 0) trackVital('INP', inp, rate('INP', inp));
  };

  // A hidden page may never fire again — report on the first hide, and also on
  // pagehide as a bfcache-safe backstop.
  const onHide = () => {
    if (document.visibilityState === 'hidden') report();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', report);

  return () => {
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', report);
    for (const { observer } of observers) observer.disconnect();
  };
}
