'use client';

import { useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { activeSections } from '@/lib/activeSections';
import { scrollToY, getScrollLimit } from '@/lib/scrollSystem';
import { MOBILE_HERO_SVH, MOBILE_SECTION_SVH } from '@/config/world';
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
    const heroPx = (MOBILE_HERO_SVH / 100) * window.innerHeight;
    const sectionPx = (MOBILE_SECTION_SVH / 100) * window.innerHeight;
    const raw = Math.floor((viewportCenter - heroPx) / sectionPx);
    return Math.min(Math.max(raw, 0), activeSections.length - 1);
  });

  if (!isMobile || activePanelId) return null;

  const jump = (index: number) => {
    const heroPx = (MOBILE_HERO_SVH / 100) * window.innerHeight;
    const sectionPx = (MOBILE_SECTION_SVH / 100) * window.innerHeight;
    const y = heroPx + (index + 0.5) * sectionPx - window.innerHeight / 2;
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
