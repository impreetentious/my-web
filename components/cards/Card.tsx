'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { motionAllowed, EASE_ARRIVE } from '@/lib/motion';
import { useSiteStore } from '@/store/useSiteStore';
import { trailColorAt, U_SURFACE } from '@/lib/descent';
import { journey } from '@/lib/journey';
import { scrambleText } from '@/lib/scramble';
import { sectionCenterFractionDesktop } from '@/lib/activeSections';
import type { ActiveSection } from '@/types';

// C1 — a card is an intercepted transmission, not a UI tile. The frame is
// notched (no radius), the header is live reception telemetry (mission clock
// + SNR derived from the depth it was decoded at), signal ticks echo the SNR,
// the title speaks the display voice, and the entrance is a decode scanline
// gated on viewport entry. A ≤2.2° pointer tilt + a specular sheen lit by the
// WORLD (gold above the line, teal from the probe below) keep it physical.
// The element stays real DOM — selection, a11y and SEO are non-negotiable.

interface CardProps {
  section: ActiveSection;
}

const SNR_SURFACE = 12.4; // dB at the top of the descent…
const SNR_FLOOR = 5.2;    // …attenuated to this at the seafloor
const TICK_COUNT = 5;

function missionClock(): string {
  const startedAt = journey.startedAt;
  const elapsed = startedAt === null ? 0 : Math.max(0, performance.now() - startedAt);
  const mm = String(Math.floor(elapsed / 60000)).padStart(2, '0');
  const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
  return `T+${mm}:${ss}`;
}

export function Card({ section }: CardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const rxRef = useRef<HTMLSpanElement>(null);
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Where this transmission lives in the world — its wake colour and which
  // side of the surface it sits on. Desktop fractions serve both breakpoints:
  // the mobile world keeps every section in the same colour family.
  const u = sectionCenterFractionDesktop(section.index);
  const accent = trailColorAt(u);
  const accentA = (alpha: number) => accent.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  const submerged = u > U_SURFACE;

  // Reception telemetry is frozen at the moment of decode — real numbers
  // from the mission clock and the depth the visitor actually intercepted
  // this transmission at.
  const decode = () => {
    const t = useSiteStore.getState().scrollT;
    const snr = SNR_SURFACE - (SNR_SURFACE - SNR_FLOOR) * t;
    const rx = `RX ${missionClock()} · SNR ${snr.toFixed(1)} DB`;
    const el = rxRef.current;
    if (el) {
      el.setAttribute('data-final', rx);
      scrambleText(el, () => rx, 340);
    }
    const lit = Math.max(1, Math.min(TICK_COUNT, Math.round((snr / SNR_SURFACE) * TICK_COUNT)));
    tickRefs.current.forEach((tick, i) => {
      if (tick) tick.style.opacity = i < lit ? '0.9' : '0.22';
    });
  };

  // Entrance — the decode: frame arrives, a scanline sweeps the plate,
  // content resolves behind it. Runs once on viewport entry, after the veil.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // R09 guard: without IntersectionObserver, cards must not stay invisible
    if (!('IntersectionObserver' in window)) {
      gsap.set(el, { opacity: 1 });
      decode();
      return;
    }

    let observer: IntersectionObserver | null = null;
    let unsubLoading: (() => void) | null = null;

    const play = () => {
      decode();
      if (motionAllowed()) {
        const content = el.querySelectorAll('[data-tx-content]');
        const tl = gsap.timeline({
          delay: Math.min(0.1 * section.index, 0.2),
        });
        tl.fromTo(
          el,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.55, ease: EASE_ARRIVE, clearProps: 'transform' },
          0
        );
        if (scanRef.current) {
          tl.fromTo(
            scanRef.current,
            { top: -36, opacity: 0.9 },
            { top: '104%', opacity: 0.55, duration: 0.62, ease: 'power1.inOut' },
            0.04
          );
          tl.set(scanRef.current, { opacity: 0 });
        }
        tl.fromTo(
          content,
          { opacity: 0, y: 9 },
          { opacity: 1, y: 0, duration: 0.5, ease: EASE_ARRIVE, stagger: 0.06 },
          0.16
        );
      } else {
        gsap.set(el, { opacity: 1 });
      }
    };

    const observe = () => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            play();
            observer?.unobserve(el);
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
    };

    // B7 — IntersectionObserver can't see the boot veil (z-100, opaque), so
    // a first-screen card used to play its entrance underneath it. Observe
    // only once the veil is gone.
    if (useSiteStore.getState().isLoading) {
      unsubLoading = useSiteStore.subscribe(
        (s) => s.isLoading,
        (loading) => {
          if (!loading) {
            unsubLoading?.();
            unsubLoading = null;
            observe();
          }
        }
      );
    } else {
      observe();
    }

    return () => {
      unsubLoading?.();
      observer?.disconnect();
    };
  }, [section.index]);

  // Pointer tilt (≤2.2°) + sheen tracking — direct style writes on mousemove,
  // eased back by the CSS transition. The sheen's light belongs to the world:
  // sun from above the line, probe from the spine side below it.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !motionAllowed()) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;  // −0.5..0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform =
        `perspective(760px) rotateX(${(-py * 3.4).toFixed(2)}deg) rotateY(${(px * 4.4).toFixed(2)}deg) translateY(-2px)`;
      el.style.setProperty('--shx', `${(50 + px * 46).toFixed(1)}%`);
      el.style.setProperty('--shy', `${(50 + py * 46).toFixed(1)}%`);
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const inner = (
    <>
      {/* Corner brackets + spine-facing port — the frame vocabulary */}
      <span className="tx-brackets" aria-hidden="true" />
      <span className="tx-port" aria-hidden="true" />

      {/* Decode scanline — rides the entrance once */}
      <div ref={scanRef} className="tx-scan" aria-hidden="true" />

      {/* Specular sheen — world-lit, pointer-tracked */}
      <span className="tx-sheen" aria-hidden="true" />

      <div className="tx-head" data-tx-content>
        <span ref={rxRef} className="tx-rx" data-final="">
          RX --:-- · SNR --
        </span>
        <span className="tx-num">{String(section.index + 1).padStart(2, '0')}</span>
      </div>

      <div className="tx-ticks" data-tx-content aria-hidden="true">
        {Array.from({ length: TICK_COUNT }, (_, i) => (
          <span
            key={i}
            ref={(el) => { tickRefs.current[i] = el; }}
            className="tx-tick"
          />
        ))}
      </div>

      <h3 className="tx-title" data-tx-content>
        {section.label}
      </h3>

      <p className="tx-tagline" data-tx-content>
        {section.tagline}
      </p>

      <div className="tx-cta" data-tx-content>
        {section.type === 'panel' ? 'DECODE' : 'READ'}
        <span className="tx-cta-arrow" aria-hidden="true">→</span>
      </div>
    </>
  );

  const styleVars = {
    '--tx-accent': accent,
    '--tx-accent-dim': accentA(0.5),
    '--tx-glow': accentA(0.16),
    '--sheen-rgba': submerged ? 'rgba(127, 196, 184, 0.10)' : 'rgba(224, 178, 110, 0.10)',
    '--sheen-angle': submerged
      ? (section.side === 'left' ? '250deg' : '110deg') // lit from the probe's side
      : '160deg',                                        // lit from the sky
    opacity: 0, // the decode reveals it on viewport entry
  } as React.CSSProperties;

  const interactionProps = {
    'aria-label': `Open ${section.label}`,
    className: 'tx-card',
    'data-side': section.side,
    style: styleVars,
  };

  // Positioning lives on the CardGrid slot (.card-slot) so transform tweens
  // on this element can never clobber the translateY(-50%) centring.
  return section.type === 'route' && section.href ? (
    <Link
      href={section.href}
      ref={(el) => {
        cardRef.current = el;
      }}
      {...interactionProps}
    >
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      ref={(el) => {
        cardRef.current = el;
      }}
      onClick={() => useSiteStore.getState().openPanel(section.id)}
      {...interactionProps}
    >
      {inner}
    </button>
  );
}
