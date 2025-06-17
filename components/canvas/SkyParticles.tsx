'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D } from 'three';

const COUNT = 200;

interface ParticleState {
  x: number;
  y: number;
  z: number;
  wobbleX: number;
  wobbleZ: number;
}

export function SkyParticles() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  // Random positions in a 20×20×10 box around the origin, plus per-particle wobble
  const particles = useMemo<ParticleState[]>(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 10,
        wobbleX: (Math.random() - 0.5) * 0.0004,
        wobbleZ: (Math.random() - 0.5) * 0.0004,
      })),
    []
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    particles.forEach((particle, i) => {
      particle.y += 0.001; // slow upward drift
      particle.x += particle.wobbleX;
      particle.z += particle.wobbleZ;

      // Past the top of the box — reset to the bottom for a seamless loop
      if (particle.y > 10) particle.y = -10;

      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.015, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
    </instancedMesh>
  );
}
