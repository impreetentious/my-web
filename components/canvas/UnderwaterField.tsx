'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  Vector2,
} from 'three';
import { useSiteStore } from '@/store/useSiteStore';
import { zoneWeights, abyssGate, waterlineScreenVh } from '@/lib/descent';
import { journey, IDLE_EVENT } from '@/lib/journey';
import { motionAllowed } from '@/lib/motion';

const COUNT = 260;
const Y_RANGE = 10;

// One particle system, three behaviours selected by aKind:
//   0 = marine snow (sinks slowly, dim white)
//   1 = bubble (rises, brighter, slight horizontal wobble, kicks with scroll)
//   2 = plankton (near-static drift, teal pulse; gathers toward the probe)
// In the abyss (uAbyss → 1) everything is lit only by its distance to the
// comet — the same falloff the sky shader applies to the water itself.
const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aKind;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2  uCometNdc;
  uniform float uAbyss;
  uniform float uWake;   // smoothed |scroll velocity| 0..1

  varying float vKind;
  varying float vPulse;
  varying vec2 vNdc;

  void main() {
    vec3 pos = position;

    if (aKind < 0.5) {
      pos.y -= uTime * aSpeed * 0.14;           // snow sinks
      pos.x += sin(uTime * 0.3 + aPhase) * 0.25;
    } else if (aKind < 1.5) {
      pos.y += uTime * aSpeed * 0.5;            // bubbles rise
      pos.x += sin(uTime * 1.4 + aPhase) * 0.12;
      pos.y += uWake * aSpeed * 1.1;            // scroll kicks up a wake
    } else {
      pos.y += sin(uTime * 0.22 + aPhase) * 0.4; // plankton hovers
      pos.x += cos(uTime * 0.18 + aPhase) * 0.4;
    }
    pos.y = mod(pos.y + ${Y_RANGE.toFixed(1)}, ${(Y_RANGE * 2).toFixed(1)}) - ${Y_RANGE.toFixed(1)};

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (34.0 / -mvPosition.z);

    // plankton lean toward the probe once it is the only light
    if (aKind > 1.5 && uAbyss > 0.01) {
      vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
      vec2 toComet = uCometNdc - ndc;
      float dl = max(length(toComet), 0.001);
      float pull = uAbyss * 0.085 * (0.65 + 0.35 * sin(uTime * 0.35 + aPhase));
      gl_Position.xy += (toComet / dl) * min(dl, 1.2) * pull * gl_Position.w;
    }

    vKind = aKind;
    vPulse = 0.55 + 0.45 * sin(uTime * (1.0 + aSpeed) + aPhase);
    vNdc = gl_Position.xy / max(gl_Position.w, 0.0001);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  uniform float uAbyss;
  uniform vec2  uCometNdc;
  uniform float uAspect;
  uniform float uWake;
  uniform float uIdlePulse;
  uniform float uWaterNdcY; // waterline in NDC — the ocean's particles stay in the ocean

  varying float vKind;
  varying float vPulse;
  varying vec2 vNdc;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    float alpha;
    vec3 color;

    if (vKind < 0.5) {
      color = vec3(0.72, 0.82, 0.87);
      alpha = smoothstep(0.5, 0.1, d) * 0.26;
    } else if (vKind < 1.5) {
      // bubble as refraction, not outline: a thin rim lit from the
      // upper-left, one displaced glint, interior left transparent
      float ring = smoothstep(0.50, 0.40, d) * smoothstep(0.26, 0.40, d);
      float rimLight = 0.25 + 0.75 * smoothstep(-0.3, 0.9, dot(uv / max(d, 1e-4), vec2(-0.55, 0.72)));
      float glint = smoothstep(0.15, 0.03, length(uv - vec2(0.11, 0.13)));
      color = vec3(0.72, 0.90, 0.93);
      alpha = (ring * rimLight + glint * 0.55) * (0.42 + uWake * 0.5);
    } else {
      color = vec3(0.18, 0.78, 0.72);
      alpha = smoothstep(0.5, 0.05, d) * vPulse * (0.65 + uIdlePulse * 0.9);
    }

    // clipped above the on-screen waterline (inverse of Starfield's
    // occlusion test): during the crossing gate nothing floats in the sky
    float belowWater = smoothstep(uWaterNdcY + 0.02, uWaterNdcY - 0.02, vNdc.y);

    // the deep is lit only by the probe
    vec2 toComet = (vNdc - uCometNdc) * vec2(uAspect, 1.0);
    float glow = exp(-dot(toComet, toComet) * 1.4);
    float lit = mix(1.0, min(1.2, 0.10 + glow * 1.5), uAbyss);

    gl_FragColor = vec4(color, alpha * uOpacity * lit * belowWater);
  }
`;

export function UnderwaterField() {
  const pointsRef = useRef<Points>(null);
  const allowMotion = useMemo(() => motionAllowed(), []);
  const idleAtRef = useRef(-1e12);

  // idle life: a single slow plankton pulse for whoever lingers in the deep
  useEffect(() => {
    const onIdle = () => {
      if (useSiteStore.getState().scrollT > 0.8) {
        idleAtRef.current = performance.now();
      }
    };
    window.addEventListener(IDLE_EVENT, onIdle);
    return () => window.removeEventListener(IDLE_EVENT, onIdle);
  }, []);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);
    const kinds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * Y_RANGE * 2;
      positions[i * 3 + 2] = -6 + Math.random() * 8;

      const roll = Math.random();
      const kind = roll < 0.55 ? 0 : roll < 0.8 ? 1 : 2;
      kinds[i] = kind;
      sizes[i] = kind === 1 ? 1.6 + Math.random() * 2.2 : 0.8 + Math.random() * 1.6;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.5 + Math.random() * 1.3;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1));
    geo.setAttribute('aKind', new Float32BufferAttribute(kinds, 1));

    const mat = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uPixelRatio: { value: 1 },
        uCometNdc: { value: new Vector2(0, 0) },
        uAbyss: { value: 0 },
        uAspect: { value: 1 },
        uWake: { value: 0 },
        uIdlePulse: { value: 0 },
        uWaterNdcY: { value: 2 }, // above the frame → nothing clipped
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame((state) => {
    const t = useSiteStore.getState().scrollT;
    const u = material.uniforms;
    u.uOpacity.value = zoneWeights(t).underwater;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uAbyss.value = abyssGate(t);
    u.uAspect.value = state.size.width / state.size.height;
    // vh from top → NDC y (+1 top, −1 bottom) — same mapping Starfield uses
    u.uWaterNdcY.value = 1 - waterlineScreenVh(t) / 50;
    u.uCometNdc.value.set(
      (journey.cometX / state.size.width) * 2 - 1,
      1 - (journey.cometY / state.size.height) * 2,
    );
    if (allowMotion) {
      u.uTime.value = state.clock.elapsedTime;
      u.uWake.value = Math.min(1, Math.abs(journey.velocity) * 0.03);
      // 2.4s bell around the idle beat
      const idleE = (performance.now() - idleAtRef.current) / 1000;
      u.uIdlePulse.value = idleE > 0 && idleE < 2.4 ? Math.sin((idleE / 2.4) * Math.PI) : 0;
    }
    if (pointsRef.current) pointsRef.current.visible = u.uOpacity.value > 0.01;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
