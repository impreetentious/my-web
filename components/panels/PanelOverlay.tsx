'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X } from 'lucide-react';
import { motionAllowed } from '@/lib/motion';
import { stopScroll, startScroll } from '@/lib/scrollSystem';
import { useSiteStore } from '@/store/useSiteStore';
import { PANEL_REGISTRY } from '@/components/panels';

export default function PanelOverlay() {
  const activePanelId = useSiteStore((s) => s.activePanelId);
  // Kept until the close tween finishes so content stays visible for the full
  // fade instead of unmounting to a blank backdrop (R17).
  const [renderedPanelId, setRenderedPanelId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Open / close transitions
  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay || !content) return;

    if (activePanelId) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      setRenderedPanelId(activePanelId);
      stopScroll();

      if (motionAllowed()) {
        // autoAlpha animates opacity AND flips visibility, so the closed overlay
        // is out of the focus order / accessibility tree, not just transparent
        gsap.to(overlay, {
          autoAlpha: 1,
          duration: 0.45,
          ease: 'power2.out',
          onStart: () => {
            overlay.style.pointerEvents = 'auto';
          },
        });
        gsap.fromTo(content, { y: 30 }, { y: 0, duration: 0.45, ease: 'power2.out' });
      } else {
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        overlay.style.pointerEvents = 'auto';
      }

      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else {
      startScroll();

      if (motionAllowed()) {
        gsap.to(overlay, {
          autoAlpha: 0,
          duration: 0.3,
          ease: 'power2.inOut',
          onComplete: () => {
            overlay.style.pointerEvents = 'none';
            setRenderedPanelId(null); // unmount content only after the fade finishes
          },
        });
        gsap.to(content, { y: 30, duration: 0.3, ease: 'power2.inOut' });
      } else {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        overlay.style.pointerEvents = 'none';
        setRenderedPanelId(null);
      }

      lastFocusedRef.current?.focus();
      lastFocusedRef.current = null;
    }
  }, [activePanelId]);

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
      {/* Backdrop — clicking it closes the panel */}
      <div
        onClick={() => useSiteStore.getState().closePanel()}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 5, 5, 0.92)',
          backdropFilter: 'blur(24px)',
        }}
      />

      {/* Close button (zIndex keeps it clickable above the content area) */}
      <button
        ref={closeButtonRef}
        type="button"
        aria-label="Close panel"
        onClick={() => useSiteStore.getState().closePanel()}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 1,
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

      {/* Content area — data-lenis-prevent stops Lenis swallowing wheel events (R16) */}
      <div
        ref={contentRef}
        data-lenis-prevent
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          padding: '60px 40px',
          maxWidth: '860px',
          margin: '0 auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
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
            Panel not found.
          </p>
        ) : null}
      </div>
    </div>
  );
}
