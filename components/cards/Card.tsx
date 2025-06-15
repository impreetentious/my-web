'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { motionAllowed } from '@/lib/motion';
import { useSiteStore } from '@/store/useSiteStore';
import { CARD_OFFSET_PX } from '@/config/world';
import type { ActiveSection, CardPosition } from '@/types';

interface CardProps {
  section: ActiveSection;
  position: CardPosition | null; // null on mobile
  isMobile: boolean;
}

export function Card({ section, position, isMobile }: CardProps) {
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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (motionAllowed()) {
            gsap.fromTo(
              el,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.55,
                ease: 'power2.out',
                delay: 0.1 * section.index,
              }
            );
          } else {
            gsap.set(el, { opacity: 1, y: 0 });
          }
          observer.unobserve(el);
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [section.index]);

  const positionStyle: React.CSSProperties = isMobile
    ? {
        position: 'relative',
        width: '100%',
      }
    : {
        position: 'absolute',
        top: position ? `${position.yCenter}px` : 0,
        transform: 'translateY(-50%)',
        width: 'var(--card-width)',
        // The card starts 20px beyond the spine anchor so the anchor node
        // circle stays visible at the card's inner edge (B.1 geometry).
        ...(section.side === 'left'
          ? { right: `calc(50% + ${CARD_OFFSET_PX + 20}px)` }
          : { left: `calc(50% + ${CARD_OFFSET_PX + 20}px)` }),
      };

  const sharedStyle: React.CSSProperties = {
    ...positionStyle,
    display: 'block',
    background: 'rgba(8, 8, 8, 0.85)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${hovered ? 'rgba(0, 255, 238, 0.7)' : 'rgba(0, 255, 238, 0.2)'}`,
    borderRadius: '4px',
    padding: '24px',
    transition: 'border-color 0.25s ease',
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
        {section.type === 'panel' ? 'Open →' : 'Read →'}
      </div>
    </>
  );

  const interactionProps = {
    'aria-label': `Open ${section.label}`,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  if (section.type === 'route' && section.href) {
    return (
      <Link
        href={section.href}
        ref={(el) => {
          cardRef.current = el;
        }}
        style={sharedStyle}
        {...interactionProps}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      ref={(el) => {
        cardRef.current = el;
      }}
      style={sharedStyle}
      onClick={() => useSiteStore.getState().openPanel(section.id)}
      {...interactionProps}
    >
      {inner}
    </button>
  );
}
