'use client';

import { useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { activeSections } from '@/lib/activeSections';
import { scrollToY, getScrollLimit } from '@/lib/scrollSystem';
import { depthReading } from '@/lib/descent';
import { SECTION_HEIGHT_PX, HEADER_HEIGHT_PX } from '@/config/world';

// the section nav is a thin altitude rail: tick marks on a hairline
// track, each at a real place in the fall; hover names the transmission and
// reads out the altitude the probe passes it at. Quiet by design.

export default function NavDots() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Derived selector: re-renders only when the active index changes, not every
  // scroll frame. Converts scrollT back to pixels via the SAME limit scrollT
  // was normalised with, which keeps the index aligned at section boundaries.
  const activeSectionIndex = useSiteStore((s) => {
    if (typeof window === 'undefined') return 0;
    const scrollPx = s.scrollT * getScrollLimit();
    const viewportCenter = scrollPx + window.innerHeight / 2;
    const raw = Math.floor((viewportCenter - HEADER_HEIGHT_PX) / SECTION_HEIGHT_PX);
    return Math.min(Math.max(raw, 0), activeSections.length - 1);
  });

  const sectionScrollY = (index: number): number =>
    Math.max(
      0,
      HEADER_HEIGHT_PX +
        (index + 0.5) * SECTION_HEIGHT_PX -
        (typeof window === 'undefined' ? 0 : window.innerHeight / 2),
    );

  const anchorT = (index: number): number => sectionScrollY(index) / Math.max(1, getScrollLimit());

  // Desktop-only chrome — phones get the ticker instead; the CSS media
  // query hides this whole rail below the breakpoint.
  return (
    <nav
      className="nav-dots"
      aria-label="Section navigation"
      style={{
        position: 'fixed',
        right: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      {/* the track — a hairline the ticks sit on */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '2px',
          bottom: '2px',
          right: '11.5px',
          width: '1px',
          background: 'rgba(255, 255, 255, 0.10)',
          pointerEvents: 'none',
        }}
      />
      {activeSections.map((section) => {
        const isActive = section.index === activeSectionIndex;
        const isHovered = hoveredId === section.id;
        return (
          <div
            key={section.id}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <span
              style={{
                position: 'absolute',
                right: '30px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--color-elevated)',
                padding: '5px 9px',
                borderRadius: '2px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: 'none',
                textAlign: 'right',
              }}
            >
              {section.label.toUpperCase()}
              {/* reading rendered only while hovered — keeps server and
                  client initial HTML identical (no window at SSR) */}
              {isHovered && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '3px',
                    fontSize: '9px',
                    color: 'var(--color-text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {depthReading(anchorT(section.index))}
                </span>
              )}
            </span>
            <button
              type="button"
              aria-label={`Go to ${section.label}`}
              onClick={() => scrollToY(sectionScrollY(section.index))}
              onMouseEnter={() => setHoveredId(section.id)}
              onMouseLeave={() => setHoveredId(null)}
              // 24px button = WCAG minimum target size; the visible tick stays thin
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: isActive ? '14px' : isHovered ? '11px' : '8px',
                  height: '1.5px',
                  background: isActive
                    ? 'var(--color-gold)'
                    : isHovered
                      ? 'rgba(224, 178, 110, 0.6)'
                      : 'rgba(255, 255, 255, 0.30)',
                  boxShadow: isActive ? '0 0 6px rgba(224, 178, 110, 0.55)' : 'none',
                  transition:
                    'width 0.3s cubic-bezier(0.16, 0.84, 0.24, 1), background 0.3s ease, box-shadow 0.3s ease',
                  marginRight: '5px',
                }}
              />
            </button>
          </div>
        );
      })}
    </nav>
  );
}
