'use client';

import dynamic from 'next/dynamic';
import { totalPageHeight } from '@/lib/activeSections';
import { useMobile } from '@/lib/useMobile';
import { useSiteStore } from '@/store/useSiteStore';
import SpineSVG from '@/components/spine/SpineSVG';
import AltitudeMilestones from '@/components/ui/AltitudeMilestones';
import CardGrid from '@/components/cards/CardGrid';
import PanelOverlay from '@/components/panels/PanelOverlay';
import LoadingScreen from '@/components/ui/LoadingScreen';
import NavDots from '@/components/ui/NavDots';
import EmailIcon from '@/components/ui/EmailIcon';
import DepthIndicator from '@/components/ui/DepthIndicator';
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

  const totalHeight = totalPageHeight;

  return (
    <>
      {/* Layer 0a: descent colour stage (CSS, all devices, fixed) — the
          space → dusk → waterline → abyss journey lives here */}
      <BackgroundGradient />

      {/* Layer 0b: WebGL atmosphere (fixed, over the gradient, desktop only).
          Mounted only after the loading screen exits — no point booting WebGL
          underneath an opaque overlay, and it keeps heavy init off the load path */}
      {!isMobile && !isLoading && <ExperienceCanvas />}

      {/* Layer 1: Scroll Container — fixed section-slot height on desktop;
          on mobile the stacked CardGrid column defines the height instead */}
      <div style={{ position: 'relative', height: isMobile ? 'auto' : totalHeight, zIndex: 1 }}>
        {/* Hero landing area */}
        <HeroSection />

        {/* SVG Spine (desktop only) */}
        {!isMobile && <SpineSVG totalHeight={totalHeight} />}

        {/* Altitude milestones drifting past at their real heights (desktop only) */}
        {!isMobile && <AltitudeMilestones />}

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
