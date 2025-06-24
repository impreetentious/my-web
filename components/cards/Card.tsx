'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { motionAllowed, EASE_ARRIVE, EASE_ARRIVE_CSS } from '@/lib/motion';
import { useSiteStore } from '@/store/useSiteStore';
import type { ActiveSection } from '@/types';

interface CardProps {
  section: ActiveSection;
}

export function Card({ section }: CardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const [hovered, setHovered] = useState(false);

  // Entrance animation — runs once when the card enters the viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // R09 guard: without IntersectionObserver, cards must not stay invisible
    if (!('IntersectionObserver' in window)) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    let observer: IntersectionObserver | null = null;
    let unsubLoading: (() => void) | null = null;

    const observe = () => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            if (motionAllowed()) {
              gsap.fromTo(
                el,
                { opacity: 0, y: 26, scale: 0.985, filter: 'blur(6px)' },
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                  duration: 0.7,
                  ease: EASE_ARRIVE,
                  // Small stagger for cards revealed together; capped so a
                  // deep-link or nav-dot jump to a late section isn't penalised
                  delay: Math.min(0.1 * section.index, 0.2),
                  // Hand transform/filter back to CSS so the hover lift works
                  clearProps: 'transform,filter',
                }
              );
            } else {
              gsap.set(el, { opacity: 1, y: 0 });
            }
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

  const visualStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    background: 'rgba(9, 13, 18, 0.72)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${hovered ? 'rgba(0, 255, 238, 0.45)' : 'rgba(0, 255, 238, 0.16)'}`,
    borderRadius: '4px',
    padding: '24px',
    transform: hovered ? 'translateY(-3px)' : 'none',
    boxShadow: hovered
      ? '0 18px 50px -18px rgba(0, 255, 238, 0.20), 0 0 24px -6px rgba(0, 255, 238, 0.08)'
      : '0 8px 30px -18px rgba(0, 0, 0, 0.8)',
    transition:
      `border-color 0.3s ease, transform 0.35s ${EASE_ARRIVE_CSS}, box-shadow 0.35s ease`,
    textAlign: 'left',
    cursor: 'pointer',
    opacity: 0, // GSAP reveals the card on viewport entry
    textDecoration: 'none',
    font: 'inherit',
    color: 'inherit',
  };

  const inner = (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            opacity: 0.9,
          }}
        >
          {section.label}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: hovered ? 'rgba(0, 255, 238, 0.5)' : 'rgba(255, 255, 255, 0.22)',
            transition: 'color 0.3s ease',
          }}
        >
          {String(section.index + 1).padStart(2, '0')}
        </div>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          marginTop: '8px',
          lineHeight: 1.6,
        }}
      >
        {section.tagline}
      </p>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          marginTop: '16px',
          color: hovered ? 'var(--color-accent)' : 'var(--color-text-muted)',
          transition: 'color 0.25s ease',
        }}
      >
        {section.type === 'panel' ? 'Decode' : 'Read'}
        <span
          style={{
            display: 'inline-block',
            marginLeft: '6px',
            transform: hovered ? 'translateX(4px)' : 'translateX(0)',
            transition: `transform 0.3s ${EASE_ARRIVE_CSS}`,
          }}
        >
          →
        </span>
      </div>
    </>
  );

  const interactionProps = {
    'aria-label': `Open ${section.label}`,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  // Positioning lives on the CardGrid slot (.card-slot) so GSAP's transform
  // tweens on this element can never clobber the translateY(-50%) centring.
  return section.type === 'route' && section.href ? (
    <Link
      href={section.href}
      ref={(el) => {
        cardRef.current = el;
      }}
      style={visualStyle}
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
      style={visualStyle}
      onClick={() => useSiteStore.getState().openPanel(section.id)}
      {...interactionProps}
    >
      {inner}
    </button>
  );
}
