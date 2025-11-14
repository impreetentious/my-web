'use client';

import { useEffect, useRef, useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { depthReading, altitudeKm, depthMetres, CROSS_T } from '@/lib/descent';
import { journey, PLUNGE_EVENT } from '@/lib/journey';
import { getScrollLimit } from '@/lib/scrollSystem';
import { scrambleText } from '@/lib/scramble';
import { audioEnabled, setAudioEnabled, getAudioIntensity } from '@/lib/audio';
import type { ZoneName } from '@/types';

const ZONE_LABELS: Record<ZoneName, string> = {
  sky: 'IN DESCENT',
  horizon: 'APPROACHING SURFACE',
  sea: 'BREAKING SURFACE',
  underwater: 'BELOW SEA LEVEL',
};

// C3a — the rate line is REAL data only: journey.velocity (px/frame) mapped
// through the scroll extent into t/s, then through the altitude/depth model's
// local derivative into world units. Negative = falling, like the readings.
const RATE_TICK_MS = 120;
const DERIV_H = 0.0005;

function rateReading(t: number): string {
  // px/frame ≈ px per raf tick — ×60 approximates px/s, ÷limit gives t/s
  const tPerSec = (journey.velocity * 60) / getScrollLimit();
  if (t < CROSS_T) {
    const kmPerT = (altitudeKm(t + DERIV_H) - altitudeKm(t - DERIV_H)) / (2 * DERIV_H);
    const kmPerSec = kmPerT * tPerSec; // negative while descending
    if (Math.abs(kmPerSec) >= 1)
      return `RATE ${kmPerSec > 0 ? '+' : '−'}${Math.abs(kmPerSec).toFixed(1)} KM/S`;
    const mPerSec = Math.round(kmPerSec * 1000);
    if (mPerSec === 0) return 'RATE 0 M/S';
    return `RATE ${mPerSec > 0 ? '+' : '−'}${Math.abs(mPerSec).toLocaleString('en-US')} M/S`;
  }
  const mPerT = (depthMetres(t + DERIV_H) - depthMetres(t - DERIV_H)) / (2 * DERIV_H);
  const mPerSec = Math.round(-mPerT * tPerSec); // depth grows downward — flip so falling reads −
  if (mPerSec === 0) return 'RATE 0 M/S';
  return `RATE ${mPerSec > 0 ? '+' : '−'}${Math.abs(mPerSec).toLocaleString('en-US')} M/S`;
}

// C3b — plunge warning burst: two lines inside the glitch window. The
// reacquisition figure is the scramble window itself — a real number.
const WARN_LINE_1 = 'WARNING: PRESSURE SPIKE';
const WARN_LINE_2 = 'SIGNAL REACQUIRED +360MS';
const WARN_SWAP_MS = 760;
const WARN_FADE_MS = 2100;
const WARN_CLEAR_MS = 2500;

// C11 — the audio gauge: four blocks breathing with the mix intensity.
function audioGauge(on: boolean, intensity: number): string {
  if (!on) return '░░░░';
  const lit = Math.max(1, Math.min(4, Math.round(intensity * 4)));
  return '▓'.repeat(lit) + '░'.repeat(4 - lit);
}

export default function DepthIndicator() {
  const activeZone = useSiteStore((s) => s.activeZone);
  const [displayZone, setDisplayZone] = useState<ZoneName>('sky');
  const [labelOpacity, setLabelOpacity] = useState(0.78);
  const [audioOn, setAudioOn] = useState(false);
  const valueRef = useRef<HTMLDivElement>(null);
  const rateRef = useRef<HTMLDivElement>(null);
  const warnRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLSpanElement>(null);
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

  // Rate line — an interval (not the scroll subscription) so the readout
  // decays to 0 with the velocity when the hand stops
  useEffect(() => {
    let last = '';
    const tick = () => {
      const el = rateRef.current;
      if (!el) return;
      const next = rateReading(useSiteStore.getState().scrollT);
      if (next !== last) {
        last = next;
        el.textContent = next;
      }
    };
    tick();
    const interval = setInterval(tick, RATE_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  // The plunge hard-flips ALT → DEPTH with a glitch tick + warning burst
  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    const onPlunge = () => {
      timeouts.forEach(clearTimeout); // rapid re-plunge — the new burst owns the clock
      timeouts = [];

      const el = valueRef.current;
      if (el) {
        glitchUntilRef.current = performance.now() + 420;
        el.classList.add('hud-glitch');
        scrambleText(el, () => depthReading(useSiteStore.getState().scrollT), 360);
        timeouts.push(setTimeout(() => el.classList.remove('hud-glitch'), 420));
      }

      const warn = warnRef.current;
      if (warn) {
        warn.textContent = WARN_LINE_1;
        warn.style.color = '#E0B26E';
        warn.style.opacity = '1';
        warn.classList.remove('hud-warn');
        void warn.offsetWidth; // restart the flicker on rapid re-plunges
        warn.classList.add('hud-warn');
        timeouts.push(
          setTimeout(() => {
            warn.textContent = WARN_LINE_2;
            warn.style.color = '#7FC4B8';
            warn.classList.remove('hud-warn');
          }, WARN_SWAP_MS),
          setTimeout(() => {
            warn.style.opacity = '0';
          }, WARN_FADE_MS),
          setTimeout(() => {
            warn.textContent = '';
          }, WARN_CLEAR_MS),
        );
      }
    };
    window.addEventListener(PLUNGE_EVENT, onPlunge);
    return () => {
      window.removeEventListener(PLUNGE_EVENT, onPlunge);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // Brief fade out → swap label → fade back in on zone change
  useEffect(() => {
    if (activeZone === displayZone) return;
    setLabelOpacity(0);
    const timeout = setTimeout(() => {
      setDisplayZone(activeZone);
      setLabelOpacity(0.78);
    }, 250);
    return () => clearTimeout(timeout);
  }, [activeZone, displayZone]);

  // Audio gauge blocks — written imperatively while the score plays
  useEffect(() => {
    if (!audioOn) {
      if (gaugeRef.current) gaugeRef.current.textContent = audioGauge(false, 0);
      return;
    }
    const tick = () => {
      if (gaugeRef.current) gaugeRef.current.textContent = audioGauge(true, getAudioIntensity());
    };
    tick();
    const interval = setInterval(tick, 400);
    return () => clearInterval(interval);
  }, [audioOn]);

  // A4 — the ticker lives on every device: placement and type scale are
  // CSS-resolved (.depth-indicator), smaller and tucked lower on phones.
  return (
    <div className="depth-indicator">
      {/* Plunge warning burst — floats above the block, no layout shift */}
      <div
        ref={warnRef}
        aria-hidden="true"
        className="depth-warn"
        style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: '10px',
          letterSpacing: '0.18em',
          whiteSpace: 'nowrap',
          opacity: 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
      />
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
        ref={rateRef}
        className="depth-rate"
        style={{
          letterSpacing: '0.14em',
          color: 'var(--color-text-muted)',
          opacity: 0.88,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        RATE 0 M/S
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
      {/* C11 — the score's gauge; mute is the default, the click is the
          autoplay gesture */}
      <button
        type="button"
        className="audio-toggle"
        aria-pressed={audioOn}
        aria-label={audioOn ? 'Turn ambient audio off' : 'Turn ambient audio on'}
        onClick={() => {
          const next = !audioEnabled();
          setAudioEnabled(next);
          setAudioOn(next);
        }}
      >
        AUDIO [<span ref={gaugeRef}>░░░░</span>] {audioOn ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
