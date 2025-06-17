'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motionAllowed } from '@/lib/motion';
import { useSiteStore } from '@/store/useSiteStore';

const BOOT_LINES = [
  'INITIALISING SCROLL ENGINE',
  'LOADING SECTION MANIFESTS',
  'CALIBRATING SPINE GEOMETRY',
  'MOUNTING ATMOSPHERIC LAYER',
];

const REVEAL_INTERVAL_MS = 280;
const EXIT_BUFFER_MS = 600;

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionAllowed()) {
      useSiteStore.getState().setIsLoading(false);
      setVisible(false);
      return;
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

    const timeout = setTimeout(() => {
      gsap.to(screenRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          useSiteStore.getState().setIsLoading(false);
          setVisible(false);
        },
      });
    }, REVEAL_INTERVAL_MS * BOOT_LINES.length + EXIT_BUFFER_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
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
        background: '#080808',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      {BOOT_LINES.map((line, i) => (
        <div
          key={line}
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            opacity: i < revealedCount ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          <span
            style={{
              color: '#444444',
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
            style={{
              width: '120px',
              height: '2px',
              background: 'rgba(0,255,238,0.15)',
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
                background: '#00FFEE',
                transition: 'width 0.22s ease-out',
              }}
            />
          </div>
          <span
            style={{
              color: '#00FFEE',
              fontSize: '10px',
              letterSpacing: '0.15em',
              fontFamily: 'var(--font-mono)',
              opacity: i < revealedCount ? 1 : 0,
            }}
          >
            DONE
          </span>
        </div>
      ))}
    </div>
  );
}
