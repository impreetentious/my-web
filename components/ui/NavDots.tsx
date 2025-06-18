'use client';

import { useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { activeSections } from '@/lib/activeSections';
import { useMobile } from '@/lib/useMobile';
import { scrollToY } from '@/lib/scrollSystem';
import {
  SECTION_HEIGHT_PX,
  HEADER_HEIGHT_PX,
  FOOTER_HEIGHT_PX,
} from '@/config/world';

const totalHeight =
  HEADER_HEIGHT_PX + activeSections.length * SECTION_HEIGHT_PX + FOOTER_HEIGHT_PX;

export default function NavDots() {
  const isMobile = useMobile();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Derived selector: re-renders only when the active index changes, not every
  // scroll frame. Converts scrollT back to pixels because the header/footer
  // zones would otherwise drift the index away from real section boundaries.
  const activeSectionIndex = useSiteStore((s) => {
    if (typeof window === 'undefined') return 0;
    const scrollPx = s.scrollT * Math.max(0, totalHeight - window.innerHeight);
    const viewportCenter = scrollPx + window.innerHeight / 2;
    const raw = Math.floor((viewportCenter - HEADER_HEIGHT_PX) / SECTION_HEIGHT_PX);
    return Math.min(Math.max(raw, 0), activeSections.length - 1);
  });

  if (isMobile) return null;

  return (
    <nav
      aria-label="Section navigation"
      style={{
        position: 'fixed',
        right: '15px', // 24px buttons centre the 6px dots where they sat before
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {activeSections.map((section) => {
        const isActive = section.index === activeSectionIndex;
        const isHovered = hoveredId === section.id;
        return (
          <div key={section.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                right: '30px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--color-elevated)',
                padding: '4px 8px',
                borderRadius: '2px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: 'none',
              }}
            >
              {section.label}
            </span>
            <button
              type="button"
              aria-label={`Go to ${section.label}`}
              onClick={() => scrollToY(HEADER_HEIGHT_PX + section.index * SECTION_HEIGHT_PX)}
              onMouseEnter={() => setHoveredId(section.id)}
              onMouseLeave={() => setHoveredId(null)}
              // 24px button = WCAG minimum target size; the visible dot stays 6px
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isActive
                    ? 'var(--color-accent)'
                    : isHovered
                      ? 'rgba(0, 255, 238, 0.5)'
                      : 'var(--color-text-muted)',
                  boxShadow: isActive ? '0 0 6px var(--color-accent)' : 'none',
                  transition: 'background 0.3s ease, box-shadow 0.3s ease',
                }}
              />
            </button>
          </div>
        );
      })}
    </nav>
  );
}
