'use client';

import { Canvas } from '@react-three/fiber';
import { Scene } from '@/components/canvas/Scene';
import { useSiteStore } from '@/store/useSiteStore';
import { probedQuality } from '@/lib/quality';

// Mounted once after boot and never unmounted for tier changes (B3): a drop
// to 'low' — fps demotion or a lost WebGL context — hides the surface and
// parks the frameloop so the animated CSS world underneath takes over, and a
// restored context resumes at the probed tier without re-initialising three.
export default function ExperienceCanvas() {
  const quality = useSiteStore((s) => s.quality);
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
        frameloop={parked ? 'never' : 'always'}
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
        <Scene />
      </Canvas>
    </div>
  );
}
