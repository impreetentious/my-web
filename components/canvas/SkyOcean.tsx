'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, Vector2 } from 'three';
import { useSiteStore } from '@/store/useSiteStore';
import { waterlineScreenVh, zoneWeights, abyssGate, CROSS_T, U_SURFACE, K } from '@/lib/descent';
import { journey, plungeElapsed, buoyancyVh } from '@/lib/journey';
import { getScrollLimit } from '@/lib/scrollSystem';
import { motionAllowed } from '@/lib/motion';

const BEAST_KEY = 'mw-abyss-beat';
const BEAST_DURATION_S = 13;
const BEAST_DELAY_S = 1.4;

// The whole world in one fullscreen fragment pass: altitude-continuous sky,
// procedural deep starfield, FBM nebulae, a living ocean surface, underwater
// light, the abyss lit by the probe, and the plunge shock — replacing v1's
// stacked CSS gradients. Colour is a function of WORLD position (scroll +
// screen offset), so descending physically slides one continuous atmosphere
// past the camera instead of cross-fading posters.

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uAspect;   // width / height (CSS px)
  uniform float uResY;     // drawing-buffer height in device px
  uniform float uSpanT;    // how much scroll-t one viewport height spans
  uniform float uWaterVh;  // waterline screen position, vh from top
  uniform vec2  uComet;    // comet position, uv space (y up)
  uniform float uCometOn;
  uniform float uPlungeE;  // seconds since the plunge (large before any)
  uniform float uAbyss;    // 0 lit world → 1 the deep
  uniform float uRays;     // god-ray gate
  uniform vec2  uMouse;    // eased pointer, −1..1
  uniform float uLite;     // medium tier (A2): single dim star layer, no nebulae
  uniform float uBeast;    // C10: abyss passage progress ∈ (0,1); off outside it
  uniform float uCross;    // F2: derived crossing scroll-t (CROSS_T)
  uniform float uSurfaceU; // F2: derived surface page-depth (U_SURFACE)
  uniform float uK;        // F2: sky-stretch factor for early-sky gates

  varying vec2 vUv;

  // ── noise ────────────────────────────────────────────────────────────────
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return v;
  }

  // ── the sky, by world altitude ───────────────────────────────────────────
  vec3 skyRamp(float wt) {
    vec3 c = vec3(0.020, 0.024, 0.051);                                  // orbit
    c = mix(c, vec3(0.027, 0.055, 0.102), smoothstep(0.10, 0.34, wt));   // high blue
    c = mix(c, vec3(0.039, 0.102, 0.184), smoothstep(0.32, 0.55, wt));   // mesosphere
    c = mix(c, vec3(0.055, 0.141, 0.251), smoothstep(0.52, 0.68, wt));   // blue hour
    c = mix(c, vec3(0.078, 0.212, 0.337), smoothstep(uSurfaceU - 0.055, uSurfaceU + 0.085, wt));   // near sea
    return c;
  }

  // Dim dense layer + sparse bright layer with glints. d measured in device
  // px so stars stay pixel-sharp at any resolution.
  float starsDim(vec2 sp, float n) {
    vec2 cell = floor(sp * n);
    vec2 f = fract(sp * n);
    vec2 pos = vec2(hash12(cell + 7.1), hash12(cell + 3.7));
    float mag = pow(hash12(cell + 11.3), 9.0);
    float dPx = length(f - pos) * uResY / n;
    return smoothstep(1.5, 0.1, dPx) * mag;
  }
  vec3 starsBright(vec2 sp, float n) {
    vec2 cell = floor(sp * n);
    vec2 f = fract(sp * n);
    vec2 pos = 0.15 + 0.7 * vec2(hash12(cell + 7.1), hash12(cell + 3.7));
    float mag = pow(hash12(cell + 11.3), 14.0);
    vec2 qPx = (f - pos) * uResY / n;
    float core = smoothstep(2.4, 0.0, length(qPx));
    float armX = exp(-abs(qPx.x) * 1.1) * exp(-abs(qPx.y) * 0.9);
    float armY = exp(-abs(qPx.y) * 0.28) * exp(-abs(qPx.x) * 1.4);
    float glint = (armX + armY) * 0.55;
    float tw = 0.75 + 0.25 * sin(uTime * (0.6 + hash12(cell + 2.2) * 1.8) + hash12(cell) * 6.28);
    vec3 tint = mix(vec3(0.79, 0.86, 1.0), vec3(1.0, 0.90, 0.76), hash12(cell + 5.5));
    return tint * (core + glint) * mag * tw;
  }

  void main() {
    float e = uPlungeE;
    float flash = smoothstep(0.0, 0.03, e) * (1.0 - smoothstep(0.05, 0.16, e));
    float wob = 1.0 - smoothstep(0.0, 0.45, e);
    float dip = smoothstep(0.02, 0.12, e) * (1.0 - smoothstep(0.25, 1.15, e));

    // refraction wobble — shader-side, applied to the sampling coords
    vec2 uv = vUv;
    float uvTop0 = 1.0 - vUv.y;
    uv.x += sin(uvTop0 * 46.0 - e * 34.0) * 0.005 * wob;
    uv.y += sin(uvTop0 * 29.0 - e * 24.0) * 0.0032 * wob;

    // C13 — the medium persists: while submerged the world keeps refracting
    // at ~10% of the plunge wobble, world-only (the DOM above stays crisp)
    float sub = smoothstep(uCross + 0.02, uCross + 0.10, uScroll);
    uv.x += sin(uvTop0 * 41.0 + uTime * 0.80) * 0.0006 * sub;
    uv.y += sin(uvTop0 * 23.0 - uTime * 0.55) * 0.0004 * sub;

    float uvTop = 1.0 - uv.y;
    float wt = uScroll + (uvTop - 0.5) * uSpanT;   // world altitude at this pixel

    // waterline, breathing via 1D noise displacement; a second, much longer
    // swell rolls under the chop so the surface never reads uniform (C13)
    float wUvTop = uWaterVh / 100.0;
    float swell = vnoise(vec2(uv.x * 2.1 + uTime * 0.045, uTime * 0.028));
    float disp = (vnoise(vec2(uv.x * 7.0 + uTime * 0.14, uTime * 0.05)) - 0.5) * 0.008
               + (swell - 0.5) * 0.0045;
    float dy = uvTop - (wUvTop + disp);            // + below the line, − above

    float deep = smoothstep(uCross + 0.02, 0.98, uScroll);
    float goldGate = smoothstep(uK * 0.50, uK * 0.66, uScroll) * (1.0 - smoothstep(uCross + 0.04, uCross + 0.10, uScroll));

    vec3 col;

    if (dy < 0.0) {
      // ── sky ──
      col = skyRamp(wt);

      // airglow — a thin breathing band the descent falls through
      float breathe = 0.8 + 0.2 * sin(uTime * 0.5);
      float ag = exp(-pow((wt - 0.565) / 0.045, 2.0)) * breathe;
      col += vec3(0.10, 0.22, 0.24) * ag * 0.16;

      // deep starfield — thousands dim, a few bright with glints; they die
      // bottom-up at the horizon because visibility follows world altitude
      float starVis = 1.0 - smoothstep(0.44, 0.62, wt);
      if (starVis > 0.003) {
        vec2 sp = vec2(uv.x * uAspect, uv.y);
        sp += uMouse * vec2(0.0075, 0.005);
        vec2 spFar = sp + vec2(0.0, -uScroll * 1.35);

        // milky way — a faint diagonal density band
        float bandD = dot(spFar - vec2(0.85, 0.35), normalize(vec2(-0.44, 0.90)));
        float band = exp(-bandD * bandD * 7.0);

        float dim = starsDim(spFar, 34.0) * (0.5 + 0.9 * band);

        if (uLite > 0.5) {
          // medium tier — one dim layer carries the whole sky
          col += vec3(0.82, 0.88, 1.0) * dim * 1.05 * starVis;
        } else {
          vec2 spMid = sp + vec2(0.0, -uScroll * 2.0);
          float dim2 = starsDim(spFar + 41.7, 58.0) * 0.55 * (0.4 + 0.8 * band);
          vec3 bright = starsBright(spMid, 13.0);
          col += (vec3(0.82, 0.88, 1.0) * (dim + dim2) * 0.85 + bright * 1.1) * starVis;
          col += vec3(0.62, 0.68, 0.85) * band * fbm(spFar * 3.1) * 0.035 * starVis;

          // FBM nebulae, very low contrast — no radial-gradient blobs
          float nebGate = (1.0 - smoothstep(0.28, 0.50, wt)) * starVis;
          vec2 np = spFar * 1.45;
          float n1 = fbm(np + fbm(np * 0.7) * 0.9);
          float n2 = fbm(np * 0.62 + vec2(43.1, 17.7));
          col += vec3(0.075, 0.09, 0.20) * smoothstep(0.42, 0.9, n1) * 0.16 * nebGate;
          col += vec3(0.14, 0.08, 0.16) * smoothstep(0.55, 0.95, n2) * 0.10 * nebGate;
        }
      }

      // golden hour hugging the surface
      float warm = exp(dy * 9.0) * goldGate;
      col += vec3(0.878, 0.698, 0.431) * warm * 0.30;
      col += vec3(0.82, 0.52, 0.28) * exp(dy * 3.2) * goldGate * 0.10;
    } else {
      // ── water ──
      float depthW = clamp(dy * 1.8, 0.0, 1.0);
      col = mix(vec3(0.043, 0.235, 0.290), vec3(0.016, 0.106, 0.149), depthW);
      col = mix(col, vec3(0.004, 0.039, 0.063), deep * (0.45 + 0.55 * depthW));

      // light entering at the surface
      col += vec3(0.35, 0.62, 0.66) * exp(-dy * 7.5) * 0.22 * (1.0 - deep * 0.85);

      // caustic shimmer just below the crossing
      float causGate = smoothstep(uCross - 0.06, uCross, uScroll) * (1.0 - smoothstep(uCross + 0.08, uCross + 0.16, uScroll));
      if (causGate > 0.003) {
        float caus = fbm(vec2(uv.x * 26.0 * uAspect, dy * 36.0) + uTime * vec2(0.22, 0.13));
        col += vec3(0.45, 0.75, 0.72) * pow(caus, 3.0) * exp(-dy * 10.0) * causGate * 0.42;
      }

      // volumetric shafts, flickering slowly, from a sun above the line
      if (uRays > 0.003) {
        vec2 sunPos = vec2(0.5 + 0.05 * sin(uTime * 0.05), wUvTop - 0.4);
        vec2 rd = vec2((uv.x - sunPos.x) * uAspect, uvTop - sunPos.y);
        float ang = atan(rd.x, rd.y);
        float shaft = vnoise(vec2(ang * 7.0, uTime * 0.10))
                    * vnoise(vec2(ang * 17.0 + 40.0, uTime * 0.055));
        float shaftMask = smoothstep(0.0, 0.22, dy) * exp(-dy * 2.4);
        col += vec3(0.42, 0.72, 0.78) * pow(shaft, 2.0) * shaftMask * uRays * 0.26;
      }

      // bioluminescent hints where the light has died
      if (uAbyss > 0.003) {
        float bio = fbm(vec2(uv.x * 3.2 * uAspect, uvTop * 3.4 + uScroll * 6.0));
        float bioTw = 0.6 + 0.4 * sin(uTime * 0.7 + uv.x * 21.0);
        col += vec3(0.05, 0.35, 0.30) * smoothstep(0.62, 0.95, bio) * bioTw * uAbyss * 0.12;
      }
    }

    // ── the surface line itself — lit water, not a 2px rule ──
    float lineAtten = 1.0 - 0.75 * smoothstep(uCross + 0.04, 0.95, uScroll);
    vec3 lineCol = mix(vec3(0.94, 0.83, 0.62), vec3(0.62, 0.84, 0.80),
                       smoothstep(uCross + 0.015, uCross + 0.06, uScroll));
    float chroma = 0.0016 * wob;
    vec3 lineGlow = vec3(
      exp(-abs(dy - chroma) * 130.0),
      exp(-abs(dy) * 130.0),
      exp(-abs(dy + chroma) * 130.0)
    );
    col += lineCol * lineGlow * 0.30 * lineAtten;
    col += lineCol * exp(-abs(dy) * 26.0) * 0.085 * lineAtten;

    // specular glints riding the swell below the line — fine grains, not blocks
    float glintBand = smoothstep(0.0, 0.008, dy) * (1.0 - smoothstep(0.015, 0.13, dy));
    if (glintBand > 0.003) {
      float sp1 = vnoise(vec2(uv.x * 300.0 * uAspect, dy * 560.0 - uTime * 0.7));
      float sp2 = vnoise(vec2(uv.x * 133.0 * uAspect + 13.0, dy * 210.0 + uTime * 0.4));
      float sparkle = pow(sp1 * sp2, 6.0) * 4.0;
      // the long swell owns the specular band — glints gather on its crests (C13)
      sparkle *= 0.55 + 0.90 * swell;
      col += lineCol * sparkle * glintBand * (0.30 + 0.45 * goldGate) * lineAtten * 0.55;
    }

    // ── the abyss is lit only by the probe ──
    vec2 cd = (uv - uComet) * vec2(uAspect, 1.0);
    float cdist2 = dot(cd, cd);
    float halo = exp(-cdist2 * 30.0);
    float ambient = mix(1.0, 0.16 + 0.84 * min(1.0, halo * 1.6), uAbyss * uCometOn);
    col *= ambient;
    col += vec3(0.42, 0.55, 0.52) * halo * halo * uAbyss * uCometOn * 0.28;

    // C10 — once per session, something vast passes at the edge of the
    // probe's light: a shadow IN the light, never lit itself. Long low body,
    // tapered tail, one dorsal hint, swimming on a slow spinal undulation.
    if (uBeast > 0.0 && uBeast < 1.0) {
      // crosses the open water just above the probe, right to left, inside
      // the halo's rim — a shadow on the light, its belly barely rim-lit
      vec2 bpos = uComet + vec2(
        mix(0.70, -0.70, uBeast),
        0.10 + 0.035 * sin(uBeast * 8.0 + 1.7)
      );
      vec2 bd = (uv - bpos) * vec2(uAspect, 1.0);
      vec2 bb = vec2(bd.x, bd.y + sin(bd.x * 9.0 + uBeast * 30.0) * 0.012);
      float body = 1.0 - smoothstep(0.35, 0.95, length(bb * vec2(3.2, 17.0)));
      float tail = 1.0 - smoothstep(0.25, 0.95, length((bb + vec2(0.17, 0.0)) * vec2(2.1, 26.0)));
      float fin  = 1.0 - smoothstep(0.30, 0.95, length((bb + vec2(-0.02, 0.045)) * vec2(16.0, 10.0)));
      float shape = max(body, max(tail * 0.85, fin * 0.9));
      // underside rim: the same body sampled a hair lower — the difference
      // is the lower contour, where the probe's light grazes it
      vec2 bbLow = bb + vec2(0.0, 0.014);
      float bodyLow = 1.0 - smoothstep(0.35, 0.95, length(bbLow * vec2(3.2, 17.0)));
      float rim = max(0.0, bodyLow - body);
      float glimpse = smoothstep(0.04, 0.18, uBeast) * (1.0 - smoothstep(0.82, 0.97, uBeast));
      float presence = uAbyss * uCometOn * glimpse;
      col *= 1.0 - shape * min(1.0, halo * 3.6) * presence * 0.88;
      col += vec3(0.16, 0.30, 0.28) * rim * min(1.0, halo * 2.4) * presence * 0.5;
    }

    // ── the plunge: flash at impact, spray ring, palette dip ──
    col += vec3(1.0, 0.95, 0.82) * flash * exp(-cdist2 * 9.0) * 1.15;
    float sprayT = e / 0.6;
    if (e < 1.2) {
      float ring = cdist2 == 0.0 ? 0.0 : sqrt(cdist2);
      float rMask = exp(-pow(ring - sprayT * 0.22, 2.0) * 800.0);
      float aC = atan(cd.y, cd.x);
      float fleck = pow(vnoise(vec2(aC * 6.0, sprayT * 3.0 + 7.0)), 3.0) * 2.2;
      col += vec3(0.95, 0.90, 0.78) * rMask * fleck
           * (1.0 - smoothstep(0.45, 1.0, sprayT));
    }
    col *= 1.0 - 0.30 * dip;

    // ── tone: filmic shoulder, vignette, grain, lifted shadows ──
    col = col / (1.0 + col * 0.28) * 1.12;

    float vd = length((uv - vec2(0.5, 0.45)) * vec2(1.15, 1.0));
    col *= 1.0 - smoothstep(0.42, 0.98, vd) * (0.30 + 0.25 * uScroll);

    float g = hash12(gl_FragCoord.xy + fract(uTime * 7.31) * vec2(113.1, 271.7));
    float g2 = hash12(gl_FragCoord.xy * 1.7 + fract(uTime * 3.77) * vec2(419.2, 371.9));
    float grainAmp = 0.016 + 0.014 * deep + 0.010 * uAbyss;
    col += vec3((g - 0.5) * grainAmp + (g2 - 0.5) * (2.0 / 255.0));

    col = max(col, vec3(0.006, 0.007, 0.010));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function SkyOcean() {
  const meshRef = useRef<Mesh>(null);
  const allowMotion = useMemo(() => motionAllowed(), []);

  // C10 — the abyss passage is a once-per-session beat: armed the first time
  // the visitor reaches the dark with motion allowed, then never again.
  const beastRef = useRef<{ seen: boolean; start: number | null }>({
    seen: true,
    start: null,
  });
  useEffect(() => {
    try {
      beastRef.current.seen = sessionStorage.getItem(BEAST_KEY) === '1';
    } catch {
      beastRef.current.seen = false;
    }
  }, []);

  const { geometry, material } = useMemo(() => {
    // single oversized triangle — covers the frame without a seam
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));

    const mat = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uAspect: { value: 1 },
        uResY: { value: 1000 },
        uSpanT: { value: 0.2 },
        uWaterVh: { value: 175 },
        uComet: { value: new Vector2(0.5, 1) },
        uCometOn: { value: 0 },
        uPlungeE: { value: 30 },
        uAbyss: { value: 0 },
        uRays: { value: 0 },
        uMouse: { value: new Vector2(0, 0) },
        uLite: { value: 0 },
        uBeast: { value: -1 },
        // F2 — derived world tuning; constant at runtime (baked from the
        // enabled section count), so never touched in the frame loop.
        uCross: { value: CROSS_T },
        uSurfaceU: { value: U_SURFACE },
        uK: { value: K },
      },
      depthTest: false,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame((state) => {
    const t = useSiteStore.getState().scrollT;
    const u = material.uniforms;
    const w = state.size.width;
    const h = state.size.height;

    // one viewport in scroll-t — normalised against the live scrollable
    // extent so the world's vertical scale is right on BOTH page heights
    // (desktop px world, mobile svh world)
    const spanT = h / getScrollLimit();
    const pe = allowMotion ? plungeElapsed(performance.now()) : 30;
    // C2 — buoyancy: the world samples a touch deeper than scroll says
    // through the crossing, and the line rides up by the same offset
    const buoy = buoyancyVh(pe);

    u.uScroll.value = t + (buoy / 100) * spanT;
    if (allowMotion) u.uTime.value = state.clock.elapsedTime;
    u.uAspect.value = w / h;
    u.uResY.value = h * state.gl.getPixelRatio();
    u.uSpanT.value = spanT;
    u.uWaterVh.value = waterlineScreenVh(t) - buoy;
    u.uLite.value = useSiteStore.getState().quality === 'medium' ? 1 : 0;
    u.uAbyss.value = abyssGate(t);
    u.uRays.value = zoneWeights(t).rays;
    u.uComet.value.set(journey.cometX / w, 1 - journey.cometY / h);
    u.uCometOn.value = journey.cometOn ? 1 : 0;
    u.uPlungeE.value = pe;
    u.uMouse.value.set(journey.mouseX, journey.mouseY);

    // C10 — arm the passage deep in the dark; play it exactly once
    const beast = beastRef.current;
    if (!beast.seen && beast.start === null && allowMotion && t > 0.9 && journey.cometOn) {
      beast.start = state.clock.elapsedTime + BEAST_DELAY_S;
      beast.seen = true;
      try {
        sessionStorage.setItem(BEAST_KEY, '1');
      } catch {
        // private mode — the beat simply plays again next visit
      }
    }
    if (beast.start !== null) {
      const p = (state.clock.elapsedTime - beast.start) / BEAST_DURATION_S;
      u.uBeast.value = p >= 1 ? -1 : p; // p<0 during the delay; shader gates on (0,1)
      if (p >= 1) beast.start = null;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-10}
    />
  );
}
