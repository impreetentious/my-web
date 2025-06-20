'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  Vector2,
} from 'three';
import { useSiteStore } from '@/store/useSiteStore';
import { zoneWeights, waterlineScreenVh } from '@/lib/descent';
import { journey } from '@/lib/journey';
import { motionAllowed } from '@/lib/motion';

// v2: the deep starfield lives in the SkyOcean shader — this system is the
// NEAR parallax layer only: fewer, sharper points that separate from the
// background on scroll, streak with scroll velocity, and lean ±6px with the
// pointer. Occluded below the waterline via uWaterNdcY.
const COUNT = 170;
const Y_RANGE = 11; // wrap bound; frustum half-height at the far plane is ~9

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aTwinkleSpeed;
  attribute float aParallax;
  attribute vec3 aTint;

  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  uniform float uStretch;  // 1 + k·|velocity| — motion elongation
  uniform vec2  uMouse;

  varying float vTwinkle;
  varying vec3 vTint;
  varying float vNdcY;
  varying float vStretch;

  void main() {
    vec3 pos = position;
    float y = pos.y + uScroll * aParallax * 26.0;
    // wrap into [-Y_RANGE, Y_RANGE]
    pos.y = mod(y + ${Y_RANGE.toFixed(1)}, ${(Y_RANGE * 2).toFixed(1)}) - ${Y_RANGE.toFixed(1)};

    // pointer parallax — nearer stars lean more
    pos.x += uMouse.x * aParallax * 0.55;
    pos.y -= uMouse.y * aParallax * 0.38;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (23.0 / -mvPosition.z) * uStretch;

    vTwinkle = 0.62 + 0.38 * sin(uTime * aTwinkleSpeed + aPhase);
    vTint = aTint;
    vNdcY = gl_Position.y / max(gl_Position.w, 0.0001);
    vStretch = uStretch;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  uniform float uWaterNdcY; // waterline in NDC; stars are occluded below it
  varying float vTwinkle;
  varying vec3 vTint;
  varying float vNdcY;
  varying float vStretch;

  void main() {
    // squash x by the stretch factor → the round point becomes a vertical
    // streak while scrolling fast, and dims like motion blur
    vec2 p = gl_PointCoord - vec2(0.5);
    p.x *= vStretch;
    float d = length(p);
    float alpha = smoothstep(0.46, 0.24, d) / (0.6 + 0.4 * vStretch);
    float aboveWater = smoothstep(uWaterNdcY - 0.03, uWaterNdcY + 0.03, vNdcY);
    gl_FragColor = vec4(vTint, alpha * vTwinkle * uOpacity * aboveWater);
  }
`;

const TINTS = [
  new Color('#DEE8F8'), // white-blue (most)
  new Color('#EFDDBC'), // warm
  new Color('#B9CDE8'), // cool blue
];

export function Starfield() {
  const pointsRef = useRef<Points>(null);
  const allowMotion = useMemo(() => motionAllowed(), []);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);
    const parallax = new Float32Array(COUNT);
    const tints = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * Y_RANGE * 2;
      positions[i * 3 + 2] = -7 + Math.random() * 9; // z in [-7, 2]

      const depth = (positions[i * 3 + 2] + 7) / 9; // 0 far → 1 near
      // small and sharp; a sparse handful get real presence
      sizes[i] =
        Math.random() < 0.08
          ? 1.7 + depth * 1.2
          : 0.5 + Math.random() * 0.8 + depth * 0.5;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.4 + Math.random() * 1.6;
      parallax[i] = 0.25 + depth * 0.75;

      const tint =
        TINTS[Math.random() < 0.72 ? 0 : Math.random() < 0.55 ? 1 : 2];
      tints[i * 3] = tint.r;
      tints[i * 3 + 1] = tint.g;
      tints[i * 3 + 2] = tint.b;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));
    geo.setAttribute('aTwinkleSpeed', new Float32BufferAttribute(speeds, 1));
    geo.setAttribute('aParallax', new Float32BufferAttribute(parallax, 1));
    geo.setAttribute('aTint', new Float32BufferAttribute(tints, 3));

    const mat = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uOpacity: { value: 1 },
        uPixelRatio: { value: 1 },
        uWaterNdcY: { value: -2 }, // below the frame → nothing occluded
        uStretch: { value: 1 },
        uMouse: { value: new Vector2(0, 0) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame((state) => {
    const t = useSiteStore.getState().scrollT;
    material.uniforms.uScroll.value = t;
    material.uniforms.uOpacity.value = zoneWeights(t).stars * 0.9;
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    // vh from top → NDC y (+1 top, −1 bottom)
    material.uniforms.uWaterNdcY.value = 1 - waterlineScreenVh(t) / 50;
    if (allowMotion) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
      const v = Math.min(3, Math.abs(journey.velocity) * 0.045);
      material.uniforms.uStretch.value = 1 + v * 1.6;
      material.uniforms.uMouse.value.set(journey.mouseX, journey.mouseY);
    }
    if (pointsRef.current) pointsRef.current.visible =
      material.uniforms.uOpacity.value > 0.01;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
