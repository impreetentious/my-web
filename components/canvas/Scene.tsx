'use client';

import { SkyOcean } from '@/components/canvas/SkyOcean';
import { Starfield } from '@/components/canvas/Starfield';
import { UnderwaterField } from '@/components/canvas/UnderwaterField';
import { ShootingStar } from '@/components/canvas/ShootingStar';
import { useMobile } from '@/lib/useMobile';

// All systems stay mounted for the whole session and fade via shader opacity
// uniforms driven by scroll — mount/unmount at zone thresholds caused a
// visible pop. SkyOcean draws first (renderOrder −10) as the opaque world;
// the particle layers sit in front of it inside the same canvas. No scene
// fog: the old FogExp2 ramp blacked out every particle by mid-page.
//
// Mobile (A2) runs the lean composition: SkyOcean carries its own deep
// starfield, so the near-parallax Starfield (pointer-driven, pointless on
// touch) and the shooting star stay desktop-only; the underwater life keeps
// the deep alive on both.
export function Scene() {
  const isMobile = useMobile();
  return (
    <>
      <SkyOcean />
      {!isMobile && <Starfield />}
      {!isMobile && <ShootingStar />}
      <UnderwaterField />
    </>
  );
}
