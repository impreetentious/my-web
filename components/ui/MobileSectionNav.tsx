'use client';

import { useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { activeSections } from '@/lib/activeSections';
import { scrollToY, getScrollLimit } from '@/lib/scrollSystem';
import { SECTION_HEIGHT_PX, HEADER_HEIGHT_PX } from '@/config/world';
import { useMobile } from '@/lib/useMobile';

// Compact mobile section navigator — altitude chips along the bottom edge.
// Desktop keeps the NavDots rail; this is the phone affordance only.

export default function MobileSectionNav() {
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);
  const activePanelId = useSiteStore((s) => s.activePanelId);

  const activeSectionIndex = useSiteStore((s) => {
    if (typeof window === 'undefined') return 0;
    const scrollPx = s.scrollT * getScrollLimit();
    const viewportCenter = scrollPx + window.innerHeight / 2;
    const raw = Math.floor((viewportCenter - HEADER_HEIGHT_PX) / SECTION_HEIGHT_PX);
    return Math.min(Math.max(raw, 0), activeSections.length - 1);
  });

  if (!isMobile || activePanelId) return null;

  const jump = (index: number) => {
    const y = HEADER_HEIGHT_PX + index * SECTION_HEIGHT_PX - window.innerHeight * 0.28;
    scrollToY(Math.max(0, y));
    setOpen(false);
  };

  const current = activeSections[activeSectionIndex];

  return (
    <nav className="m-sec-nav" aria-label="Transmission navigator">
      <button
        type="button"
        className="m-sec-nav__toggle"
        aria-expanded={open}
        aria-controls="m-sec-nav-list"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="m-sec-nav__eyebrow">NAV</span>
        <span className="m-sec-nav__current">
          {current ? current.label.toUpperCase() : 'DESCENT'}
        </span>
      </button>
      {open && (
        <ul id="m-sec-nav-list" className="m-sec-nav__list">
          {activeSections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                className="m-sec-nav__item"
                aria-current={section.index === activeSectionIndex ? 'true' : undefined}
                onClick={() => jump(section.index)}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
