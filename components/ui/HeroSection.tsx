'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { motionAllowed, EASE_ARRIVE, STAGGER } from '@/lib/motion';
import { useSiteStore } from '@/store/useSiteStore';
import { journey } from '@/lib/journey';
import site from '@/content/site.json';

// The hero lives in orbit, so its accent is the world gold of the space zone
// (#E0B26E) — interface chrome elsewhere stays cyan.
const GOLD = '#E0B26E';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const nameWrapRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const roleWrapRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLParagraphElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLSpanElement>(null);

  // Entrance — fires once when the loading screen releases isLoading. In the
  // handoff take, the boot line is already sitting on the tag's position, so
  // the tag crossfades in place while name/role rise through line masks.
  useEffect(() => {
    let revealed = false;
    let timeline: gsap.core.Timeline | null = null;
    let unsubscribe: (() => void) | null = null;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      unsubscribe?.();
      unsubscribe = null;

      if (!motionAllowed()) {
        gsap.set([tagRef.current, cueRef.current], { opacity: 1 });
        gsap.set([nameRef.current, roleRef.current], { y: '0%' });
        return;
      }

      const handoff = journey.heroHandoff;
      const tl = gsap.timeline({ delay: handoff ? 0 : 0.2 });
      timeline = tl;
      if (handoff) {
        tl.fromTo(
          tagRef.current,
          { opacity: 0 },
          { opacity: 0.8, duration: 0.45, ease: 'none' },
          0.18,
        );
      } else {
        tl.fromTo(
          tagRef.current,
          { opacity: 0, y: -8 },
          { opacity: 0.8, y: 0, duration: 0.5, ease: EASE_ARRIVE },
        );
      }
      // The pre-reveal offset uses translateY(%), so these tweens drive the
      // same GSAP y channel with percentage strings.
      tl.fromTo(
        nameRef.current,
        { y: '112%' },
        {
          y: '0%',
          duration: 0.75,
          ease: EASE_ARRIVE,
          onComplete: () => {
            if (nameWrapRef.current) nameWrapRef.current.style.overflow = 'visible';
          },
        },
        handoff ? 0.3 : '-=0.25',
      );
      tl.fromTo(
        roleRef.current,
        { y: '120%' },
        {
          y: '0%',
          duration: 0.65,
          ease: EASE_ARRIVE,
          onComplete: () => {
            if (roleWrapRef.current) roleWrapRef.current.style.overflow = 'visible';
          },
        },
        `-=${0.75 - STAGGER * 2}`,
      );
      tl.fromTo(
        sweepRef.current,
        { backgroundPosition: '135% 0%' },
        { backgroundPosition: '-35% 0%', duration: 1.05, ease: 'power2.inOut' },
        handoff ? 0.55 : '-=0.45',
      );
      tl.fromTo(
        cueRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: EASE_ARRIVE },
        '-=0.7',
      );
    };

    if (useSiteStore.getState().isLoading) {
      unsubscribe = useSiteStore.subscribe(
        (state) => state.isLoading,
        (isLoading) => {
          if (!isLoading) reveal();
        },
      );
    } else {
      reveal();
    }

    return () => {
      unsubscribe?.();
      timeline?.kill();
    };
  }, []);

  // The whole hero sinks and fades as the descent begins; the scroll cue dies
  // first. Direct style writes — this runs every scroll frame.
  useEffect(() => {
    const apply = (scrollT: number) => {
      const el = containerRef.current;
      if (el) {
        const p = Math.min(1, scrollT / 0.09);
        el.style.opacity = String(1 - p);
        el.style.transform = `translateY(${-p * 60}px)`;
      }
      if (cueRef.current && scrollT > 0.015) {
        cueRef.current.style.opacity = '0';
      }
    };
    apply(useSiteStore.getState().scrollT);
    const unsubscribe = useSiteStore.subscribe((s) => s.scrollT, apply);
    return () => unsubscribe();
  }, []);

  return (
    // Height is CSS-resolved (.hero-section): HEADER_HEIGHT_PX on desktop via
    // the world container's --hero-h-desktop, one full small-viewport on
    // mobile, avoiding a breakpoint-dependent hydration shift.
    <div ref={containerRef} className="hero-section">
      {/* width:100% (not fit-content) so long lines wrap inside narrow viewports */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        {/* One barely-there signal pulse behind the name — not radar clipart */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div
            className="signal-pulse"
            style={{
              position: 'absolute',
              left: '50%',
              top: '46%',
              width: '380px',
              height: '380px',
              marginLeft: '-190px',
              marginTop: '-190px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, transparent 58%, rgba(224, 178, 110, 0.055) 63%, rgba(224, 178, 110, 0.015) 67%, transparent 71%)',
            }}
          />
        </div>

        <p
          ref={tagRef}
          data-hero-tag
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: GOLD,
            opacity: 0,
            position: 'relative',
          }}
        >
          — SIGNAL RECEIVED —
        </p>
        <div ref={nameWrapRef} style={{ overflow: 'hidden', marginTop: '16px' }}>
          {/* the display voice: archival serif against the instrument mono */}
          <h1
            ref={nameRef}
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontWeight: 400,
              fontSize: 'clamp(42px, 6vw, 62px)',
              letterSpacing: '0.005em',
              color: 'var(--color-text-primary)',
              position: 'relative',
              transform: 'translateY(112%)',
              textShadow: '0 0 40px rgba(224, 178, 110, 0.14)',
            }}
          >
            {site.name}
            {/* glyph-accurate specular overlay; invisible until (and
                after) its one background-position pass */}
            <span
              ref={sweepRef}
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                color: 'transparent',
                backgroundImage:
                  'linear-gradient(100deg, transparent 42%, rgba(255, 241, 209, 0.9) 50%, rgba(224, 178, 110, 0.35) 55%, transparent 62%)',
                backgroundSize: '250% 100%',
                backgroundPosition: '135% 0%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {site.name}
            </span>
          </h1>
        </div>
        <div ref={roleWrapRef} style={{ overflow: 'hidden', marginTop: '16px' }}>
          <p
            ref={roleRef}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.15em',
              color: 'var(--color-text-secondary)',
              position: 'relative',
              transform: 'translateY(120%)',
            }}
          >
            {site.heroRoleLine}
          </p>
        </div>

        {/* Scroll cue: whisper + falling light */}
        <div
          ref={cueRef}
          style={{
            marginTop: '28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            position: 'relative',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: 'var(--color-text-muted)',
              animation: 'pulse-opacity 2s ease-in-out infinite',
            }}
          >
            scroll to descend
          </p>
          <div
            className="cue-drip"
            style={{
              width: '1px',
              height: '42px',
              background:
                'linear-gradient(to bottom, rgba(224, 178, 110, 0.65), rgba(224, 178, 110, 0))',
            }}
          />
        </div>
      </div>
    </div>
  );
}
