'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X } from 'lucide-react';
import {
  motionAllowed,
  EASE_ARRIVE,
  EASE_CUT,
  STAGGER,
} from '@/lib/motion';
import { stopScroll, startScroll } from '@/lib/scrollSystem';
import { useSiteStore } from '@/store/useSiteStore';
import { activeSections } from '@/lib/activeSections';
import { depthReading } from '@/lib/descent';
import { journey } from '@/lib/journey';
import { scrambleText } from '@/lib/scramble';
import { useMobile } from '@/lib/useMobile';
import { PANEL_REGISTRY } from '@/components/panels';
import aboutData from '@/content/about.json';
import type { ZoneName } from '@/types';

// A panel is a decoded dossier, not a modal: the veil takes on the colour of
// the depth it was opened at, the meta rail carries live telemetry, a 1px
// accent rule draws top→down, an oversized ghost numeral rises behind the
// content, the title reveals through a line mask while the mono meta strings
// tick through a decode scramble, and content blocks arrive on the house
// 60ms stagger. Close is a 0.3s cut.

const ZONE_LABELS: Record<ZoneName, string> = {
  sky: 'IN DESCENT',
  horizon: 'APPROACHING SURFACE',
  sea: 'BREAKING SURFACE',
  underwater: 'BELOW SEA LEVEL',
};

// Veil colour by the depth the dossier was opened at — a dossier opened in
// the deep is visibly darker and cooler than one opened in orbit.
const VEIL_STOPS: Array<[number, [number, number, number]]> = [
  [0.0, [6, 8, 18]],
  [0.5, [10, 14, 26]],
  [0.72, [5, 18, 25]],
  [0.85, [2, 10, 15]],
  [1.0, [1, 6, 10]],
];

function veilBackground(t: number): string {
  let a = VEIL_STOPS[0];
  let b = VEIL_STOPS[VEIL_STOPS.length - 1];
  for (let i = 0; i < VEIL_STOPS.length - 1; i++) {
    if (t >= VEIL_STOPS[i][0] && t <= VEIL_STOPS[i + 1][0]) {
      a = VEIL_STOPS[i];
      b = VEIL_STOPS[i + 1];
      break;
    }
  }
  const f = (t - a[0]) / (b[0] - a[0] || 1);
  const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.93)`;
}

function missionClock(): string {
  const startedAt = journey.startedAt;
  const elapsed = startedAt === null ? 0 : Math.max(0, performance.now() - startedAt);
  const mm = String(Math.floor(elapsed / 60000)).padStart(2, '0');
  const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
  return `T+${mm}:${ss}`;
}

const railLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.26em',
  color: 'rgba(255, 255, 255, 0.30)',
  marginBottom: '5px',
};

const railValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  letterSpacing: '0.14em',
  color: 'var(--color-text-secondary)',
};

export default function PanelOverlay() {
  const isMobile = useMobile();
  const activePanelId = useSiteStore((s) => s.activePanelId);
  // Kept until the close tween finishes so content stays visible for the full
  // fade instead of unmounting to a blank backdrop (R17).
  const [renderedPanelId, setRenderedPanelId] = useState<string | null>(null);
  const renderedRef = useRef<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const titleInnerRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Open/close state machine — mount + scroll lock on open, cut + unmount on close
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (activePanelId) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      renderedRef.current = activePanelId;
      setRenderedPanelId(activePanelId);
      stopScroll();
      // Lenis.stop() only swallows wheel/touch — without this, arrow keys and
      // space still scroll the page behind the dossier
      document.body.style.overflow = 'hidden';
    } else if (renderedRef.current) {
      renderedRef.current = null;
      startScroll();
      document.body.style.overflow = '';

      tlRef.current?.kill();
      if (motionAllowed()) {
        const tl = gsap.timeline({
          onComplete: () => {
            overlay.style.pointerEvents = 'none';
            setRenderedPanelId(null);
          },
        });
        tlRef.current = tl;
        tl.to(frameRef.current, { opacity: 0, y: 14, duration: 0.26, ease: EASE_CUT }, 0)
          .to(ghostRef.current, { opacity: 0, duration: 0.24, ease: EASE_CUT }, 0)
          .to(veilRef.current, { opacity: 0, duration: 0.3, ease: EASE_CUT }, 0.02)
          .set(overlay, { autoAlpha: 0 });
      } else {
        gsap.set(overlay, { autoAlpha: 0 });
        overlay.style.pointerEvents = 'none';
        setRenderedPanelId(null);
      }

      lastFocusedRef.current?.focus();
      lastFocusedRef.current = null;
    }
  }, [activePanelId]);

  // The decode sequence — runs after the dossier content is in the DOM
  useEffect(() => {
    if (!renderedPanelId) return;
    const overlay = overlayRef.current;
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!overlay || !frame || !content) return;

    overlay.style.pointerEvents = 'auto';
    tlRef.current?.kill();

    // B5 — the overlay becomes visible SYNCHRONOUSLY, then focus moves. The
    // focus used to race the timeline's first tick: focusing an element that
    // is still visibility:hidden silently no-ops, stranding focus on the
    // invoking card.
    gsap.set(overlay, { autoAlpha: 1 });
    closeButtonRef.current?.focus();

    if (motionAllowed()) {
      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.set(frame, { opacity: 1, y: 0 }, 0);
      tl.fromTo(veilRef.current, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: EASE_ARRIVE }, 0);
      tl.fromTo(
        ghostRef.current,
        { clipPath: 'inset(0 0 100% 0)', y: 70, opacity: 1 },
        { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.75, ease: EASE_ARRIVE },
        0.05
      );
      tl.fromTo(
        ruleRef.current,
        { scaleY: 0 },
        { scaleY: 1, transformOrigin: 'top', duration: 0.6, ease: EASE_ARRIVE },
        0.08
      );
      tl.fromTo(
        titleInnerRef.current,
        { yPercent: 115 },
        { yPercent: 0, duration: 0.6, ease: EASE_ARRIVE },
        0.16
      );
      if (railRef.current) {
        tl.fromTo(
          railRef.current.querySelectorAll('[data-rail]'),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.45, ease: EASE_ARRIVE, stagger: STAGGER },
          0.14
        );
      }
      // decode tick on the mono meta strings only — never on body text
      tl.call(
        () => {
          overlay.querySelectorAll('[data-scramble]').forEach((el) => {
            const final = el.getAttribute('data-final') ?? el.textContent ?? '';
            scrambleText(el, () => final, 300);
          });
        },
        undefined,
        0.2
      );
      tl.fromTo(
        content.querySelectorAll('[data-block]'),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE_ARRIVE, stagger: STAGGER },
        0.24
      );
      tl.fromTo(
        content.querySelectorAll('[data-hair]'),
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: 'left', duration: 0.55, ease: EASE_ARRIVE, stagger: STAGGER },
        0.28
      );
    } else {
      gsap.set(frame, { opacity: 1, y: 0 });
      gsap.set(veilRef.current, { opacity: 1 });
    }
  }, [renderedPanelId]);

  // Escape closes; Tab is trapped inside the overlay while a panel is rendered
  useEffect(() => {
    if (!renderedPanelId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        useSiteStore.getState().closePanel();
        return;
      }
      if (event.key === 'Tab' && overlayRef.current) {
        const focusables = overlayRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [renderedPanelId]);

  const PanelComponent = renderedPanelId ? PANEL_REGISTRY[renderedPanelId] : null;
  const section = renderedPanelId
    ? activeSections.find((s) => s.id === renderedPanelId)
    : null;
  const indexLabel = String((section?.index ?? 0) + 1).padStart(2, '0');

  // Telemetry snapshot at open — this render only happens on open/close
  const openT = useSiteStore.getState().scrollT;
  const openZone = useSiteStore.getState().activeZone;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-hidden={!renderedPanelId}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        opacity: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Veil — tinted by the zone the dossier was opened in */}
      <div
        ref={veilRef}
        onClick={() => useSiteStore.getState().closePanel()}
        style={{
          position: 'absolute',
          inset: 0,
          background: renderedPanelId ? veilBackground(openT) : 'rgba(5, 6, 13, 0.93)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      />

      {/* Ghost numeral rising behind the content — smaller and fully inside
          the frame on mobile (A10: the old right:-6% crop read as a mistake) */}
      <div
        ref={ghostRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: isMobile ? '3%' : '-2%',
          right: isMobile ? '4%' : '2%',
          fontFamily: 'var(--font-display), Georgia, serif',
          fontWeight: 400,
          fontSize: isMobile ? 'clamp(130px, 38vw, 200px)' : 'clamp(220px, 34vw, 420px)',
          lineHeight: 1,
          color: 'rgba(255, 255, 255, 0.035)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {renderedPanelId ? indexLabel : ''}
      </div>

      {/* Close */}
      <button
        ref={closeButtonRef}
        type="button"
        aria-label="Close panel"
        onClick={() => useSiteStore.getState().closePanel()}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          background: 'transparent',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '4px',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
        }}
      >
        <X size={20} strokeWidth={1.5} />
      </button>

      {/* Frame — the scrollable dossier; data-lenis-prevent stops Lenis
          swallowing wheel events inside it (R16) */}
      <div
        ref={frameRef}
        data-lenis-prevent
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '210px 1px minmax(0, 1fr)',
            gap: isMobile ? '18px' : '44px',
            maxWidth: '1060px',
            margin: '0 auto',
            padding: isMobile ? '68px 20px 80px' : '96px 48px 120px',
            minHeight: '100%',
            alignItems: 'start',
          }}
        >
          {/* Meta rail — the decode header. Mobile collapses it to a compact
              strip (A10) so the title lands on the first screen; the [ESC]
              hint is desktop-only — a keyboard promise means nothing under a
              thumb, and the ✕ is in view. */}
          {isMobile ? (
            <div
              ref={railRef}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'baseline',
                gap: '4px 14px',
              }}
            >
              <p
                data-rail
                data-scramble
                data-final={`TRANSMISSION ${indexLabel}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.3em',
                  color: 'var(--color-accent)',
                  opacity: 0.85,
                }}
              >
                {`TRANSMISSION ${indexLabel}`}
              </p>
              <p
                data-rail
                data-scramble
                data-final={depthReading(openT)}
                style={{ ...railValueStyle, fontSize: '10px' }}
              >
                {depthReading(openT)}
              </p>
              <p data-rail style={{ ...railValueStyle, fontSize: '10px' }}>
                {ZONE_LABELS[openZone]}
              </p>
            </div>
          ) : (
            <div
              ref={railRef}
              style={{
                position: 'sticky',
                top: '96px',
                display: 'flex',
                flexDirection: 'column',
                gap: '22px',
              }}
            >
              <div data-rail>
                <p
                  data-scramble
                  data-final={`TRANSMISSION ${indexLabel}`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.3em',
                    color: 'var(--color-accent)',
                    opacity: 0.85,
                  }}
                >
                  {`TRANSMISSION ${indexLabel}`}
                </p>
              </div>
              <div data-rail>
                <p style={railLabelStyle}>SIGNAL</p>
                <p style={railValueStyle}>{section?.label.toUpperCase() ?? ''}</p>
              </div>
              <div data-rail>
                <p style={railLabelStyle}>POSITION</p>
                <p data-scramble data-final={depthReading(openT)} style={railValueStyle}>
                  {depthReading(openT)}
                </p>
              </div>
              <div data-rail>
                <p style={railLabelStyle}>STATUS</p>
                <p
                  data-scramble
                  data-final={`DECODED ${missionClock()}`}
                  style={railValueStyle}
                >
                  {`DECODED ${missionClock()}`}
                </p>
              </div>
              <div data-rail>
                <p style={railLabelStyle}>ZONE</p>
                <p style={railValueStyle}>{ZONE_LABELS[openZone]}</p>
              </div>
              {/* C6 — the About dossier's rail keeps the recruiter path in
                  reach the whole scroll: full record + open channel */}
              {renderedPanelId === 'about' && (
                <div data-rail>
                  <p style={railLabelStyle}>ACTIONS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '2px' }}>
                    <a
                      href={aboutData.channels.resumeHref}
                      download
                      style={{
                        ...railValueStyle,
                        color: 'var(--color-gold)',
                        textDecoration: 'none',
                        fontSize: '10px',
                      }}
                    >
                      FULL RECORD ↓
                    </a>
                    <a
                      href={`mailto:${aboutData.channels.email}`}
                      style={{
                        ...railValueStyle,
                        color: 'var(--color-gold)',
                        textDecoration: 'none',
                        fontSize: '10px',
                      }}
                    >
                      OPEN CHANNEL →
                    </a>
                  </div>
                </div>
              )}
              <div data-rail style={{ marginTop: '18px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    letterSpacing: '0.22em',
                    color: 'rgba(255, 255, 255, 0.22)',
                  }}
                >
                  [ESC] CLOSE
                </p>
              </div>
            </div>
          )}

          {/* Accent rule — drawn top→down on open */}
          {!isMobile && (
            <div
              ref={ruleRef}
              aria-hidden="true"
              style={{
                width: '1px',
                alignSelf: 'stretch',
                background:
                  'linear-gradient(180deg, rgba(224,178,110,0.55) 0%, rgba(224,178,110,0.18) 30%, rgba(0,255,238,0.16) 75%, transparent 100%)',
              }}
            />
          )}

          {/* Content column */}
          <div ref={contentRef} style={{ minWidth: 0 }}>
            <div style={{ overflow: 'hidden', marginBottom: '40px' }}>
              <h2
                ref={titleInnerRef}
                style={{
                  fontFamily: 'var(--font-display), Georgia, serif',
                  fontWeight: 400,
                  fontSize: 'clamp(42px, 6vw, 66px)',
                  lineHeight: 1.02,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '0.005em',
                }}
              >
                {section?.label ?? ''}
              </h2>
            </div>

            {PanelComponent ? (
              <PanelComponent />
            ) : renderedPanelId ? (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                }}
              >
                Transmission lost.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
