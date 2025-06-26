'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { totalPageHeight, mobileWorldSvh, activeSections } from '@/lib/activeSections';
import { initQuality, runFpsProbe } from '@/lib/quality';
import { useMobile } from '@/lib/useMobile';
import { useSiteStore } from '@/store/useSiteStore';
import {
  HEADER_HEIGHT_PX,
  FOOTER_HEIGHT_PX,
  CARD_OFFSET_PX,
  MOBILE_GUTTER_VW,
  MOBILE_FOOTER_SVH,
} from '@/config/world';
import { ScrollProvider } from '@/components/providers/ScrollProvider';
import SpineSVG from '@/components/spine/SpineSVG';
import MobileSpine from '@/components/spine/MobileSpine';
import AltitudeMilestones from '@/components/ui/AltitudeMilestones';
import CardGrid from '@/components/cards/CardGrid';
import PanelOverlay from '@/components/panels/PanelOverlay';
import LoadingScreen from '@/components/ui/LoadingScreen';
import NavDots from '@/components/ui/NavDots';
import EmailIcon from '@/components/ui/EmailIcon';
import DepthIndicator from '@/components/ui/DepthIndicator';
import CursorRing from '@/components/ui/CursorRing';
import HeroSection from '@/components/ui/HeroSection';
import FooterSection from '@/components/ui/FooterSection';
import BackgroundGradient from '@/components/ui/BackgroundGradient';

const ExperienceCanvas = dynamic(
  () => import('@/components/canvas/ExperienceCanvas'),
  { ssr: false }
);

export default function Home() {
  const isMobile = useMobile();
  const isLoading = useSiteStore((s) => s.isLoading);
  const quality = useSiteStore((s) => s.quality);

  // B3/A2 — capability tier before the veil lifts; fps probe once it has.
  useEffect(() => {
    initQuality();
    let cancelProbe: (() => void) | null = null;
    let unsub: (() => void) | null = null;
    if (useSiteStore.getState().isLoading) {
      unsub = useSiteStore.subscribe(
        (s) => s.isLoading,
        (loading) => {
          if (!loading && !cancelProbe) {
            cancelProbe = runFpsProbe();
            unsub?.();
            unsub = null;
          }
        }
      );
    } else {
      cancelProbe = runFpsProbe();
    }
    return () => {
      unsub?.();
      cancelProbe?.();
    };
  }, []);

  // WebGL boots once — after the veil (no point rendering under an opaque
  // overlay) and only if the capability probe passed. It then STAYS mounted:
  // tier drops hide/park it inside ExperienceCanvas, so a restored context
  // can come back without re-initialising three.js (B3).
  const [canvasBooted, setCanvasBooted] = useState(false);
  useEffect(() => {
    if (!isLoading && quality !== 'low') setCanvasBooted(true);
  }, [isLoading, quality]);

  return (
    <ScrollProvider>
      {/* B12 — first tab stop jumps past the descent chrome to the first
          transmission card */}
      <a className="skip-link" href={`#card-${activeSections[0]?.id ?? ''}`}>
        Skip to transmissions
      </a>

      {/* Layer 0a: descent colour stage (CSS, fixed) — static backstop under
          the canvas; the full animated fallback world when quality is 'low' */}
      <BackgroundGradient />

      {/* Layer 0b: WebGL atmosphere (fixed, over the gradient, all devices
          that pass the tier probe — dpr 1 lite set on mobile) */}
      {canvasBooted && <ExperienceCanvas />}

      {/* Layer 1: the world. Heights are CSS-resolved per breakpoint (A1/A8)
          from the custom properties below — the server HTML paints correctly
          on every device, CLS ≈ 0. */}
      <main
        className="world-container"
        style={
          {
            '--world-h-desktop': `${totalPageHeight}px`,
            '--world-svh-mobile': String(mobileWorldSvh),
            '--hero-h-desktop': `${HEADER_HEIGHT_PX}px`,
            '--footer-h-desktop': `${FOOTER_HEIGHT_PX}px`,
            '--footer-svh-mobile': String(MOBILE_FOOTER_SVH),
            '--card-side-offset': `calc(50% + ${CARD_OFFSET_PX + 20}px)`,
            '--m-gutter': `${MOBILE_GUTTER_VW}vw`,
          } as React.CSSProperties
        }
      >
        {/* Hero landing area */}
        <HeroSection />

        {/* The probe's wake — full spine on desktop, gutter wake on mobile */}
        {!isMobile && <SpineSVG totalHeight={totalPageHeight} />}
        {isMobile && <MobileSpine />}

        {/* Altitude milestones drifting past at their real heights */}
        <AltitudeMilestones />

        {/* Cards */}
        <CardGrid />

        {/* Footer closing section */}
        <FooterSection />
      </main>

      {/* Layer 2: Fixed UI */}
      <NavDots />
      <EmailIcon />
      <DepthIndicator />
      <CursorRing />

      {/* Layer 3: Panel Overlay */}
      <PanelOverlay />

      {/* Layer 4: Loading Screen */}
      <LoadingScreen />
    </ScrollProvider>
  );
}
