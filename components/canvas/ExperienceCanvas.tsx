'use client';

import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Scene } from '@/components/canvas/Scene';
import { useSiteStore } from '@/store/useSiteStore';
import { probedQuality } from '@/lib/quality';
import { motionAllowed } from '@/lib/motion';

// Reduced motion: the shader world freezes its clock (SkyOcean advances uTime
// only when motionAllowed), so a continuous frameloop would redraw identical
// frames forever — GPU and battery cost with zero visible change. Render on
// demand instead: scroll still drives the world, idle costs nothing.
function ReducedMotionFrames() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate(); // first frame, then one per scroll change
    return useSiteStore.subscribe(
      (s) => s.scrollT,
      () => invalidate()
    );
  }, [invalidate]);
  return null;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => !motionAllowed());
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Mounted once after boot and never unmounted for tier changes (B3): a drop
// to 'low' — fps demotion or a lost WebGL context — hides the surface and
// parks the frameloop so the animated CSS world underneath takes over, and a
// restored context resumes at the probed tier without re-initialising three.
export default function ExperienceCanvas() {
  const quality = useSiteStore((s) => s.quality);
  const reduced = useReducedMotion();
  const parked = quality === 'low';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: parked ? 'none' : 'block',
      }}
    >
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={quality === 'high' ? [1, 2] : 1}
        frameloop={parked ? 'never' : reduced ? 'demand' : 'always'}
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          const el = gl.domElement;
          el.addEventListener('webglcontextlost', (event) => {
            event.preventDefault(); // allow the browser to attempt a restore
            useSiteStore.getState().setQuality('low');
          });
          el.addEventListener('webglcontextrestored', () => {
            useSiteStore.getState().setQuality(probedQuality());
          });
        }}
      >
        {!parked && reduced && <ReducedMotionFrames />}
        <Scene />
      </Canvas>
    </div>
  );
}
