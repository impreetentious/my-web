'use client';

import dynamic from 'next/dynamic';
import { activeSections } from '@/lib/activeSections';
import { useMobile } from '@/lib/useMobile';
import {
  SECTION_HEIGHT_PX,
  HEADER_HEIGHT_PX,
  FOOTER_HEIGHT_PX,
} from '@/config/world';
import SpineSVG from '@/components/spine/SpineSVG';
import CardGrid from '@/components/cards/CardGrid';
import PanelOverlay from '@/components/panels/PanelOverlay';
import LoadingScreen from '@/components/ui/LoadingScreen';
import NavDots from '@/components/ui/NavDots';
import EmailIcon from '@/components/ui/EmailIcon';
import DepthIndicator from '@/components/ui/DepthIndicator';
import HeroSection from '@/components/ui/HeroSection';
import FooterSection from '@/components/ui/FooterSection';

const ExperienceCanvas = dynamic(
  () => import('@/components/canvas/ExperienceCanvas'),
  { ssr: false }
);

export default function Home() {
  const isMobile = useMobile();

  const totalHeight =
    HEADER_HEIGHT_PX +
    activeSections.length * SECTION_HEIGHT_PX +
    FOOTER_HEIGHT_PX;

  return (
    <>
      {/* Layer 0: WebGL Atmosphere (fixed, behind everything, desktop only) */}
      {!isMobile && <ExperienceCanvas />}

      {/* Layer 1: Scroll Container — fixed section-slot height on desktop;
          on mobile the stacked CardGrid column defines the height instead */}
      <div style={{ position: 'relative', height: isMobile ? 'auto' : totalHeight, zIndex: 1 }}>
        {/* Hero landing area */}
        <HeroSection />

        {/* SVG Spine (desktop only) */}
        {!isMobile && <SpineSVG totalHeight={totalHeight} />}

        {/* Cards */}
        <CardGrid />

        {/* Footer closing section */}
        <FooterSection />
      </div>

      {/* Layer 2: Fixed UI */}
      <NavDots />
      <EmailIcon />
      <DepthIndicator />

      {/* Layer 3: Panel Overlay */}
      <PanelOverlay />

      {/* Layer 4: Loading Screen */}
      <LoadingScreen />
    </>
  );
}
