'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motionAllowed, EASE_ARRIVE, EASE_CUT } from '@/lib/motion';
import { useSiteStore } from '@/store/useSiteStore';
import { journey } from '@/lib/journey';
import { scrambleText } from '@/lib/scramble';

// Loading → hero is ONE take (§3.5.5): the final acquisition line detaches
// from the boot list, glides to the hero tag's exact position while
// scramble-morphing into "— SIGNAL RECEIVED —", the veil lifts underneath it
// (comet igniting at the top of the path in the same beat), and the hero's
// own tag crossfades in beneath the departing line. No screen swap.
//
// B6 — every beat rides ONE GSAP timeline. The old setInterval/setTimeout
// stack desynced under tab throttling (boot observed stretched to multiple
// seconds); gsap's ticker + lagSmoothing keep the sequence coherent and
// finish() is guarded to run exactly once.

const BOOT_LINES = [
  'TELEMETRY LINK ESTABLISHED',
  'CALIBRATING DESCENT VECTOR',
  'ATMOSPHERIC MODEL LOADED',
  'ACQUIRING CARRIER SIGNAL',
];

const REVEAL_INTERVAL_S = 0.28;
const HANDOFF_TEXT = '— SIGNAL RECEIVED —';

// sessionStorage can THROW in storage-restricted contexts (sandboxed iframes,
// hardened privacy modes). The boot must never strand on it: a failed read
// means "not booted" (full theatre), a failed write means it replays.
function readBooted(): boolean {
  try {
    return sessionStorage.getItem('mw-booted') === '1';
  } catch {
    return false;
  }
}
function writeBooted(): void {
  try {
    sessionStorage.setItem('mw-booted', '1');
  } catch {
    // restricted storage — the theatre replays next load, nothing breaks
  }
}

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  // Only the first-visit full-theatre path shows a skip affordance — the
  // reduced-motion and same-session paths are already instant.
  const [showSkip, setShowSkip] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastLabelRef = useRef<HTMLSpanElement>(null);
  const lastExtrasRef = useRef<(HTMLElement | null)[]>([]);
  const finishedRef = useRef(false);
  // Set inside the effect once the boot timeline exists, so both the button
  // and the keyboard handler cut to the site through the same path.
  const skipRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!motionAllowed()) {
      useSiteStore.getState().setIsLoading(false);
      setVisible(false);
      return;
    }

    // Returning visitors in the same tab session skip the boot theatre —
    // a quick fade instead of the full sequence
    if (readBooted()) {
      const fade = gsap.to(screenRef.current, {
        opacity: 0,
        duration: 0.35,
        delay: 0.15,
        ease: EASE_CUT,
        onComplete: () => {
          useSiteStore.getState().setIsLoading(false);
          setVisible(false);
        },
      });
      return () => {
        fade.kill();
      };
    }

    // Past the instant paths — this is the full boot, so offer the skip.
    setShowSkip(true);

    let handoff: gsap.core.Timeline | null = null;

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const screen = screenRef.current;
      const label = lastLabelRef.current;
      const target = document.querySelector('[data-hero-tag]') as HTMLElement | null;

      const release = () => {
        // release first — the storage write must never gate the veil lift
        useSiteStore.getState().setIsLoading(false);
        writeBooted();
      };

      // Fallback: no measurable hero → plain veil lift
      if (!screen || !label || !target) {
        release();
        gsap.to(screen, {
          opacity: 0,
          duration: 0.6,
          ease: EASE_CUT,
          onComplete: () => setVisible(false),
        });
        return;
      }

      const lrect = label.getBoundingClientRect();
      const trect = target.getBoundingClientRect();

      handoff = gsap.timeline();
      // the other rows and the final row's chrome cut away…
      const fading = [
        ...rowRefs.current.slice(0, BOOT_LINES.length - 1),
        ...lastExtrasRef.current,
      ].filter(Boolean) as HTMLElement[];
      handoff.to(fading, { opacity: 0, duration: 0.3, ease: EASE_CUT, stagger: 0.035 });

      // …the acquisition line detaches and settles onto the hero tag's spot,
      // decoding into the received signal
      handoff.set(label, {
        position: 'fixed',
        left: lrect.left,
        top: lrect.top,
        width: 'auto',
        margin: 0,
        zIndex: 2,
      });
      handoff.call(() => scrambleText(label, () => HANDOFF_TEXT, 420));
      handoff.to(
        label,
        {
          left: trect.left,
          top: trect.top,
          letterSpacing: '0.25em',
          color: '#E0B26E',
          duration: 0.6,
          ease: EASE_ARRIVE,
        },
        '<'
      );
      handoff.to({}, { duration: 0.22 }); // hold the received signal

      // veil lifts — world + comet ignition + hero reveal, one beat
      handoff.call(() => {
        journey.heroHandoff = true;
        screen.style.pointerEvents = 'none';
        release();
      });
      handoff.to(screen, { backgroundColor: 'rgba(5, 6, 13, 0)', duration: 0.65, ease: EASE_CUT });
      // the departing line crossfades with the hero's identical tag beneath it
      handoff.to(label, { opacity: 0, duration: 0.4, ease: 'none' }, '<+0.2');
      handoff.call(() => setVisible(false));
    };

    // One clock for the whole boot: row reveals, bar fills, then the handoff
    const boot = gsap.timeline();
    BOOT_LINES.forEach((_, i) => {
      const at = i * REVEAL_INTERVAL_S;
      boot.to(rowRefs.current[i], { opacity: 1, duration: 0.15, ease: 'none' }, at);
      boot.to(
        barRefs.current[i],
        { width: '100%', duration: 0.22, ease: 'power1.out' },
        at
      );
    });
    boot.call(
      finish,
      undefined,
      BOOT_LINES.length * REVEAL_INTERVAL_S + 0.48
    );

    // Skip: a clean cut to the site, not the elaborate handoff. Guarded by the
    // same finishedRef, so it and the natural finish can never both run. The
    // veil lifts fast; the boot flag is still written so a reload won't replay.
    const skip = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      boot.kill();
      handoff?.kill();
      const screen = screenRef.current;
      journey.heroHandoff = true;
      useSiteStore.getState().setIsLoading(false);
      writeBooted();
      if (!screen) {
        setVisible(false);
        return;
      }
      screen.style.pointerEvents = 'none';
      gsap.to(screen, {
        opacity: 0,
        duration: 0.4,
        ease: EASE_CUT,
        onComplete: () => setVisible(false),
      });
    };
    skipRef.current = skip;

    const onKeySkip = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener('keydown', onKeySkip);

    return () => {
      window.removeEventListener('keydown', onKeySkip);
      boot.kill();
      handoff?.kill();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={screenRef}
      // the <noscript> rule in app/layout.tsx hides the veil when no client
      // JS will ever lift it — the server HTML underneath stays reachable
      data-boot-veil=""
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#05060D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '0 20px',
      }}
    >
      {BOOT_LINES.map((line, i) => {
        const isLast = i === BOOT_LINES.length - 1;
        return (
          <div
            key={line}
            ref={(el) => { rowRefs.current[i] = el; }}
            style={{
              display: 'flex',
              width: '100%',
              maxWidth: '448px',
              gap: 'clamp(10px, 3vw, 16px)',
              alignItems: 'center',
              opacity: 0, // the boot timeline reveals each row
            }}
          >
            <span
              ref={isLast ? lastLabelRef : undefined}
              style={{
                color: '#54595F',
                flex: '1 1 auto',
                minWidth: 0,
                fontSize: 'clamp(9px, 2.8vw, 11px)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {line}
            </span>
            <div
              ref={(el) => { if (isLast) lastExtrasRef.current[0] = el; }}
              style={{
                width: 'clamp(48px, 18vw, 120px)',
                flexShrink: 0,
                height: '2px',
                background: 'rgba(0,255,238,0.14)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                ref={(el) => { barRefs.current[i] = el; }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '0%',
                  background: 'rgba(0, 255, 238, 0.75)',
                }}
              />
            </div>
            <span
              ref={(el) => { if (isLast) lastExtrasRef.current[1] = el; }}
              style={{
                color: 'rgba(0, 255, 238, 0.75)',
                fontSize: 'clamp(8px, 2.4vw, 10px)',
                letterSpacing: '0.15em',
                fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}
            >
              LOCK
            </span>
          </div>
        );
      })}

      {showSkip && (
        <button
          type="button"
          onClick={() => skipRef.current?.()}
          aria-label="Skip the intro sequence"
          style={{
            position: 'absolute',
            bottom: 'clamp(20px, 6vh, 40px)',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 14px',
            background: 'transparent',
            border: '1px solid rgba(0, 255, 238, 0.22)',
            borderRadius: '3px',
            color: 'rgba(0, 255, 238, 0.7)',
            fontSize: 'clamp(8px, 2.4vw, 10px)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            transition: 'border-color 0.25s ease, color 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 255, 238, 0.6)';
            e.currentTarget.style.color = 'var(--color-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 255, 238, 0.22)';
            e.currentTarget.style.color = 'rgba(0, 255, 238, 0.7)';
          }}
        >
          Skip ⏎ / Esc
        </button>
      )}
    </div>
  );
}
