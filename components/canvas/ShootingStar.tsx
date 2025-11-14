'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Mesh, ShaderMaterial } from 'three';
import { useSiteStore } from '@/store/useSiteStore';
import { zoneWeights, WATERLINE } from '@/lib/descent';
import { IDLE_EVENT } from '@/lib/journey';
import { motionAllowed } from '@/lib/motion';

// One reusable streak: bright head, tapering golden tail. Re-spawns at a
// random interval and heading while the visitor is still in the space zone.
const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    // head at uv.x = 1, tail fades toward 0
    float along = pow(vUv.x, 2.4);
    float across = smoothstep(0.5, 0.0, abs(vUv.y - 0.5));
    vec3 color = mix(vec3(0.92, 0.78, 0.56), vec3(0.98, 0.94, 0.86), vUv.x);
    gl_FragColor = vec4(color, along * across * uOpacity * 0.85);
  }
`;

const DURATION = 0.85; // seconds of flight
const MIN_GAP = 4; // seconds between spawns
const MAX_GAP = 10;

interface FlightState {
  active: boolean;
  progress: number;
  nextAt: number;
  startX: number;
  startY: number;
  dirX: number;
  dirY: number;
}

export function ShootingStar() {
  const meshRef = useRef<Mesh>(null);
  const allowMotion = useMemo(() => motionAllowed(), []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: { uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );

  const flight = useRef<FlightState>({
    active: false,
    progress: 0,
    nextAt: MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP),
    startX: 0,
    startY: 0,
    dirX: 1,
    dirY: -0.3,
  });

  // idle life: an extra streak for whoever lingers under the stars
  useEffect(() => {
    const onIdle = () => {
      const f = flight.current;
      if (!f.active && useSiteStore.getState().scrollT < 0.45) {
        f.nextAt = Math.min(f.nextAt, 0.4);
      }
    };
    window.addEventListener(IDLE_EVENT, onIdle);
    return () => window.removeEventListener(IDLE_EVENT, onIdle);
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const scrollT = useSiteStore.getState().scrollT;
    const starsVisible = zoneWeights(scrollT).stars;
    const f = flight.current;

    // no streaks once the ocean is in frame — they'd fly into the water
    if (!allowMotion || starsVisible < 0.4 || scrollT > WATERLINE.enterT) {
      mesh.visible = false;
      f.active = false;
      return;
    }

    if (!f.active) {
      mesh.visible = false;
      f.nextAt -= delta;
      if (f.nextAt <= 0) {
        f.active = true;
        f.progress = 0;
        // spawn in the upper band, heading diagonally down
        f.startX = (Math.random() - 0.5) * 16;
        f.startY = 3 + Math.random() * 4;
        const angle = -0.35 - Math.random() * 0.4; // radians below horizontal
        const sign = Math.random() < 0.5 ? -1 : 1;
        f.dirX = Math.cos(angle) * sign;
        f.dirY = Math.sin(angle);
        mesh.rotation.z = Math.atan2(f.dirY, f.dirX);
      }
      return;
    }

    f.progress += delta / DURATION;
    if (f.progress >= 1) {
      f.active = false;
      f.nextAt = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
      mesh.visible = false;
      return;
    }

    const travel = 9;
    mesh.visible = true;
    mesh.position.set(
      f.startX + f.dirX * f.progress * travel,
      f.startY + f.dirY * f.progress * travel,
      -3,
    );
    // brief fade in, longer fade out
    const envelope = Math.sin(Math.min(1, f.progress) * Math.PI);
    material.uniforms.uOpacity.value = envelope * 0.9 * starsVisible;
  });

  return (
    <mesh ref={meshRef} material={material} visible={false}>
      <planeGeometry args={[2.6, 0.045]} />
    </mesh>
  );
}
