'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { FogExp2 } from 'three';
import { useSiteStore } from '@/store/useSiteStore';
import { SkyParticles } from '@/components/canvas/SkyParticles';

export function Scene() {
  const { scene } = useThree();
  const activeZone = useSiteStore((s) => s.activeZone);

  // Fog density deepens with scroll — updated directly on the scene, no re-renders
  useEffect(() => {
    const fog = new FogExp2(0x080808, 0.01);
    scene.fog = fog;

    const unsubscribe = useSiteStore.subscribe(
      (state) => state.scrollT,
      (scrollT) => {
        // 0.01 at the top of the page, 0.08 fully scrolled
        fog.density = 0.01 + scrollT * 0.07;
      }
    );

    return () => {
      unsubscribe();
      scene.fog = null;
    };
  }, [scene]);

  return (
    <>
      <ambientLight intensity={0.3} color={0x111111} />
      {(activeZone === 'sky' || activeZone === 'horizon') && <SkyParticles />}
    </>
  );
}
