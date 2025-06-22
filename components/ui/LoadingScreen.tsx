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

const BOOT_LINES = [
  'TELEMETRY LINK ESTABLISHED',
  'CALIBRATING DESCENT VECTOR',
  'ATMOSPHERIC MODEL LOADED',
  'ACQUIRING CARRIER SIGNAL',
];

const REVEAL_INTERVAL_MS = 280;
const HANDOFF_TEXT = '— SIGNAL RECEIVED —';

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const screenRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastLabelRef = useRef<HTMLSpanElement>(null);
  const lastExtrasRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!motionAllowed()) {
      useSiteStore.getState().setIsLoading(false);
      setVisible(false);
      return;
    }

    // Returning visitors in the same tab session skip the boot theatre —
    // a quick fade instead of the full sequence
    if (sessionStorage.getItem('mw-booted') === '1') {
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

    const interval = setInterval(() => {
      setRevealedCount((count) => {
        if (count >= BOOT_LINES.length) {
          clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, REVEAL_INTERVAL_MS);

    let tl: gsap.core.Timeline | null = null;

    const finish = () => {
      const screen = screenRef.current;
      const label = lastLabelRef.current;
      const target = document.querySelector('[data-hero-tag]') as HTMLElement | null;

      const release = () => {
        sessionStorage.setItem('mw-booted', '1');
        useSiteStore.getState().setIsLoading(false);
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

      tl = gsap.timeline();
      // the other rows and the final row's chrome cut away…
      const fading = [
        ...rowRefs.current.slice(0, BOOT_LINES.length - 1),
        ...lastExtrasRef.current,
      ].filter(Boolean) as HTMLElement[];
      tl.to(fading, { opacity: 0, duration: 0.3, ease: EASE_CUT, stagger: 0.035 });

      // …the acquisition line detaches and settles onto the hero tag's spot,
      // decoding into the received signal
      tl.set(label, {
        position: 'fixed',
        left: lrect.left,
        top: lrect.top,
        width: 'auto',
        margin: 0,
        zIndex: 2,
      });
      tl.call(() => scrambleText(label, () => HANDOFF_TEXT, 420));
      tl.to(
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
      tl.to({}, { duration: 0.22 }); // hold the received signal

      // veil lifts — world + comet ignition + hero reveal, one beat
      tl.call(() => {
        journey.heroHandoff = true;
        screen.style.pointerEvents = 'none';
        release();
      });
      tl.to(screen, { backgroundColor: 'rgba(5, 6, 13, 0)', duration: 0.65, ease: EASE_CUT });
      // the departing line crossfades with the hero's identical tag beneath it
      tl.to(label, { opacity: 0, duration: 0.4, ease: 'none' }, '<+0.2');
      tl.call(() => setVisible(false));
    };

    const timeout = setTimeout(
      finish,
      REVEAL_INTERVAL_MS * BOOT_LINES.length + 480
    );

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      tl?.kill();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={screenRef}
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
              gap: '16px',
              alignItems: 'center',
              opacity: i < revealedCount ? 1 : 0,
              transition: 'opacity 0.15s ease',
            }}
          >
            <span
              ref={isLast ? lastLabelRef : undefined}
              style={{
                color: '#54595F',
                width: '260px',
                fontSize: '11px',
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
                width: '120px',
                height: '2px',
                background: 'rgba(0,255,238,0.14)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: i < revealedCount ? '100%' : '0%',
                  background: 'rgba(0, 255, 238, 0.75)',
                  transition: 'width 0.22s ease-out',
                }}
              />
            </div>
            <span
              ref={(el) => { if (isLast) lastExtrasRef.current[1] = el; }}
              style={{
                color: 'rgba(0, 255, 238, 0.75)',
                fontSize: '10px',
                letterSpacing: '0.15em',
                fontFamily: 'var(--font-mono)',
                opacity: i < revealedCount ? 1 : 0,
              }}
            >
              LOCK
            </span>
          </div>
        );
      })}
    </div>
  );
}
