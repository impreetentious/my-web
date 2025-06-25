'use client';

import { useEffect, useRef, useState } from 'react';
import { generateSpinePath } from '@/lib/spinePathGenerator';
import { useSiteStore } from '@/store/useSiteStore';
import {
  TRAIL_STOPS,
  trailColorAt,
  cometScreenVh,
  waterlineScreenVh,
} from '@/lib/descent';
import { journey, PLUNGE_EVENT, IDLE_EVENT, plungeElapsed, buoyancyVh } from '@/lib/journey';
import { motionAllowed, EASE_ARRIVE_CSS } from '@/lib/motion';
import type { SpineAnchor } from '@/types';

interface SpineSVGProps {
  totalHeight: number;
}

// The spine is the probe's wake. v2 rules:
//   · NOTHING renders ahead of the comet — no route hint, no waiting nodes.
//   · the traced trail is layered strokes only (no SVG gaussian filters):
//     a near-white 1px core at low opacity over one wide soft under-glow,
//     plus a hot section confined to the last ~250px behind the head
//     (dasharray window) so the wake visibly cools with distance.
//   · anchors materialise as the comet nears (~1 viewport), ripple once when
//     passed, and their connectors draw toward the card.
//   · the head is small; fast scroll stretches an anisotropic streak along
//     the travel direction and sheds short-lived sparks.
//   · comet page-y comes from cometProgress() — an arc-length y-inversion of
//     the sampled path — so it meets the waterline mid-viewport at CROSS_T
//     exactly, at any window size.
// All per-frame work is imperative attribute/style writes in one rAF loop.

const HOT_TAIL_PX = 250;
const HOT_INNER_PX = 90;
const SPARK_POOL = 14;

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  active: boolean;
}

export default function SpineSVG({ totalHeight }: SpineSVGProps) {
  const glowWideRef = useRef<SVGPathElement>(null);
  const glowTightRef = useRef<SVGPathElement>(null);
  const coreRef = useRef<SVGPathElement>(null);
  const hotRef = useRef<SVGPathElement>(null);
  const hotInnerRef = useRef<SVGPathElement>(null);
  const measureRef = useRef<SVGPathElement>(null);

  const dotGroupRef = useRef<SVGGElement>(null);
  const igniteRef = useRef<SVGGElement>(null);
  const parallaxRef = useRef<SVGGElement>(null);
  const dotWarmRef = useRef<SVGCircleElement>(null);
  const dotCoolRef = useRef<SVGCircleElement>(null);
  const dotRingRef = useRef<SVGCircleElement>(null);
  const pingRef = useRef<SVGCircleElement>(null);
  const flareRef = useRef<SVGCircleElement>(null);
  const tangentRef = useRef<SVGGElement>(null);
  const streakRef = useRef<SVGLineElement>(null);

  const anchorGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const rippleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const haloRefs = useRef<(SVGCircleElement | null)[]>([]);
  const ringRefs = useRef<(SVGCircleElement | null)[]>([]);
  const nodeCoreRefs = useRef<(SVGCircleElement | null)[]>([]);
  const connectorRefs = useRef<(SVGLineElement | null)[]>([]);
  const passedState = useRef<boolean[]>([]);

  const sparkRefs = useRef<(SVGCircleElement | null)[]>([]);
  const sparks = useRef<Spark[]>(
    Array.from({ length: SPARK_POOL }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, active: false,
    }))
  );

  const [pathString, setPathString] = useState('');
  const [anchors, setAnchors] = useState<SpineAnchor[]>([]);
  const [totalPathLength, setTotalPathLength] = useState(0);

  // Pre-sampled path points — getPointAtLength is too expensive per frame,
  // so it runs once per geometry and the rAF lerps this table instead.
  const samplesRef = useRef<{ xs: Float32Array; ys: Float32Array } | null>(null);
  const anchorLengthsRef = useRef<number[]>([]);

  // Generate the path on mount and regenerate on (debounced) resize
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const generate = () => {
      const { d, anchors: nextAnchors } = generateSpinePath(
        window.innerWidth,
        totalHeight
      );
      setPathString(d);
      setAnchors(nextAnchors);
    };

    generate();

    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(generate, 200);
    };

    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', onResize);
    };
  }, [totalHeight]);

  // Measure + sample the new geometry
  useEffect(() => {
    const path = measureRef.current;
    if (!path || !pathString) return;

    const length = path.getTotalLength();
    const sampleCount = Math.min(900, Math.max(200, Math.ceil(length / 6)));
    const xs = new Float32Array(sampleCount + 1);
    const ys = new Float32Array(sampleCount + 1);
    for (let i = 0; i <= sampleCount; i++) {
      const p = path.getPointAtLength((length * i) / sampleCount);
      xs[i] = p.x;
      ys[i] = p.y;
    }
    samplesRef.current = { xs, ys };

    // Path y is monotonic, so each anchor's arc length comes from a y-scan
    const anchorLengths: number[] = [];
    let cursor = 0;
    for (const anchor of anchors) {
      while (cursor < sampleCount && ys[cursor] < anchor.y) cursor++;
      anchorLengths.push((cursor / sampleCount) * length);
    }
    anchorLengthsRef.current = anchorLengths;
    passedState.current = anchors.map(() => false);

    setTotalPathLength(length);
  }, [pathString, anchors]);

  // Ignition — the comet lights at the top of the path as the veil lifts
  useEffect(() => {
    const unsubscribe = useSiteStore.subscribe(
      (state) => state.isLoading,
      (isLoading) => {
        if (isLoading || !motionAllowed()) return;
        const ignite = igniteRef.current;
        const flare = flareRef.current;
        if (ignite) {
          ignite.style.transformBox = 'fill-box';
          ignite.style.transformOrigin = 'center';
          ignite.animate(
            [
              { transform: 'scale(0.2)', opacity: 0 },
              { transform: 'scale(1.35)', opacity: 1, offset: 0.55 },
              { transform: 'scale(1)', opacity: 1 },
            ],
            { duration: 950, easing: EASE_ARRIVE_CSS, fill: 'forwards' }
          );
        }
        if (flare) {
          flare.style.transformBox = 'fill-box';
          flare.style.transformOrigin = 'center';
          flare.animate(
            [
              { transform: 'scale(0.3)', opacity: 0.9 },
              { transform: 'scale(2.6)', opacity: 0 },
            ],
            { duration: 900, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)' }
          );
        }
        unsubscribe();
      }
    );
    return () => unsubscribe();
  }, []);

  // One-shot beats: plunge spray burst, idle ping
  useEffect(() => {
    const burst = (count: number, spread: number, up: number) => {
      if (!motionAllowed()) return;
      const pool = sparks.current;
      let spawned = 0;
      for (let i = 0; i < pool.length && spawned < count; i++) {
        if (pool[i].active) continue;
        const s = pool[i];
        s.x = journey.cometX + (Math.random() - 0.5) * 24;
        s.y = journey.cometY;
        s.vx = (Math.random() - 0.5) * spread;
        s.vy = -Math.random() * up - 0.4;
        s.age = 0;
        s.life = 0.5 + Math.random() * 0.5;
        s.active = true;
        spawned++;
      }
    };

    const onPlunge = () => burst(12, 5.2, 3.4);
    const onIdle = () => {
      if (useSiteStore.getState().scrollT >= 0.45) return; // space only
      const ping = pingRef.current;
      if (ping && motionAllowed()) {
        ping.style.transformBox = 'fill-box';
        ping.style.transformOrigin = 'center';
        ping.animate(
          [
            { transform: 'scale(1)', opacity: 0.55 },
            { transform: 'scale(5)', opacity: 0 },
          ],
          { duration: 1600, easing: 'cubic-bezier(0.16, 0.84, 0.24, 1)' }
        );
      }
    };

    window.addEventListener(PLUNGE_EVENT, onPlunge);
    window.addEventListener(IDLE_EVENT, onIdle);
    return () => {
      window.removeEventListener(PLUNGE_EVENT, onPlunge);
      window.removeEventListener(IDLE_EVENT, onIdle);
    };
  }, []);

  // The frame loop: comet placement, trail reveal, anchor lifecycle, streak,
  // parallax and sparks. Attribute writes only — React never re-renders here.
  useEffect(() => {
    if (totalPathLength === 0) return;

    const allowMotion = motionAllowed();
    const L = totalPathLength;
    let lastS = -1;
    let lastTime = performance.now();
    let rafId = 0;

    const arcAtPageY = (targetY: number): number => {
      const samples = samplesRef.current!;
      const ys = samples.ys;
      const count = ys.length - 1;
      let lo = 0;
      let hi = count;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] < targetY) lo = mid;
        else hi = mid;
      }
      const span = ys[hi] - ys[lo] || 1;
      const frac = Math.min(1, Math.max(0, (targetY - ys[lo]) / span));
      return ((lo + frac) / count) * L;
    };

    const pointAtArc = (s: number): { x: number; y: number; i: number } => {
      const samples = samplesRef.current!;
      const count = samples.xs.length - 1;
      const f = Math.min(count - 0.001, Math.max(0, (s / L) * count));
      const i = Math.floor(f);
      const frac = f - i;
      return {
        x: samples.xs[i] + (samples.xs[i + 1] - samples.xs[i]) * frac,
        y: samples.ys[i] + (samples.ys[i + 1] - samples.ys[i]) * frac,
        i,
      };
    };

    const frame = () => {
      rafId = requestAnimationFrame(frame);
      if (!samplesRef.current) return;

      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const t = useSiteStore.getState().scrollT;
      const vh = window.innerHeight;
      // C2 — the probe overshoots the crossing with its momentum and one
      // damped rebound settles it; same curve the shader's world offset rides
      const buoy = allowMotion ? buoyancyVh(plungeElapsed(now)) : 0;
      // screen-curve + live scrollY: exact at any window size, immune to the
      // dev overlay padding body height beyond the world container
      const targetY = Math.min(
        totalHeight,
        Math.max(0, window.scrollY + ((cometScreenVh(t) + buoy) / 100) * vh)
      );
      const s = arcAtPageY(targetY);
      const head = pointAtArc(s);

      // export the probe's screen position for the WebGL layers
      const screenY = head.y - window.scrollY;
      journey.cometX = head.x;
      journey.cometY = screenY;
      journey.cometOn = true;

      if (Math.abs(s - lastS) > 0.05) {
        lastS = s;

        const offset = String(L - s);
        if (glowWideRef.current) glowWideRef.current.style.strokeDashoffset = offset;
        if (glowTightRef.current) glowTightRef.current.style.strokeDashoffset = offset;
        if (coreRef.current) coreRef.current.style.strokeDashoffset = offset;
        // hot window: pattern shifted so its lit dash ends exactly at the head
        if (hotRef.current)
          hotRef.current.style.strokeDashoffset = String(HOT_TAIL_PX - s);
        if (hotInnerRef.current)
          hotInnerRef.current.style.strokeDashoffset = String(HOT_INNER_PX - s);

        if (dotGroupRef.current)
          dotGroupRef.current.setAttribute(
            'transform',
            `translate(${head.x}, ${head.y})`
          );

        // warm above the surface, cool below — judged against the actual
        // on-screen waterline (buoyed like the shader's), so the flip lands
        // exactly at the plunge
        const waterY = ((waterlineScreenVh(t) - buoy) / 100) * vh;
        const cool = Math.min(1, Math.max(0, (screenY - waterY + 30) / 60));
        if (dotWarmRef.current) dotWarmRef.current.style.opacity = String(1 - cool);
        if (dotCoolRef.current) dotCoolRef.current.style.opacity = String(cool);
        const u = head.y / totalHeight;
        if (dotRingRef.current) dotRingRef.current.style.stroke = trailColorAt(u);

        // anchors: nothing ahead, materialise on approach, ripple on pass
        const anchorLengths = anchorLengthsRef.current;
        for (let a = 0; a < anchorLengths.length; a++) {
          const group = anchorGroupRefs.current[a];
          if (!group) continue;
          const distAhead = anchorLengths[a] - s;
          const passed = distAhead <= 0;
          const approach = Math.min(1, Math.max(0, 1 - distAhead / vh));
          const vis = passed ? 1 : approach * approach * 0.85;
          const scale = 0.55 + 0.45 * (passed ? 1 : approach);
          group.style.opacity = String(vis);
          group.setAttribute(
            'transform',
            `translate(${anchors[a]?.x ?? 0}, ${anchors[a]?.y ?? 0}) scale(${scale})`
          );

          if (passedState.current[a] !== passed) {
            passedState.current[a] = passed;
            const halo = haloRefs.current[a];
            const ring = ringRefs.current[a];
            const core = nodeCoreRefs.current[a];
            const connector = connectorRefs.current[a];
            if (halo) halo.style.opacity = passed ? '0.55' : '0';
            if (ring) ring.style.opacity = passed ? '1' : '0.55';
            if (core) core.style.opacity = passed ? '1' : '0';
            if (connector) connector.style.transform = passed ? 'scaleX(1)' : 'scaleX(0)';
            if (passed && allowMotion) {
              const ripple = rippleRefs.current[a];
              if (ripple) {
                ripple.style.transformBox = 'fill-box';
                ripple.style.transformOrigin = 'center';
                ripple.animate(
                  [
                    { transform: 'scale(1)', opacity: 0.5 },
                    { transform: 'scale(4.6)', opacity: 0 },
                  ],
                  { duration: 750, easing: EASE_ARRIVE_CSS }
                );
              }
            }
          }
        }
      }

      if (!allowMotion) return;

      // velocity streak along the travel direction
      const v = journey.velocity;
      const samples = samplesRef.current;
      const i = head.i;
      const dx = samples.xs[i + 1] - samples.xs[i];
      const dy = samples.ys[i + 1] - samples.ys[i];
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const speed = Math.min(90, Math.abs(v) * 1.15);
      if (tangentRef.current)
        tangentRef.current.setAttribute(
          'transform',
          `rotate(${v >= 0 ? angle : angle + 180})`
        );
      if (streakRef.current) {
        streakRef.current.setAttribute('x2', String(-speed));
        streakRef.current.style.opacity = String(Math.min(0.55, Math.abs(v) * 0.014));
      }

      // pointer parallax on the glow only — the core stays on the path
      if (parallaxRef.current)
        parallaxRef.current.setAttribute(
          'transform',
          `translate(${journey.mouseX * 6}, ${journey.mouseY * 4})`
        );

      // shed sparks while moving fast
      const pool = sparks.current;
      if (Math.abs(v) > 8 && Math.random() < Math.min(0.55, Math.abs(v) * 0.012)) {
        for (let k = 0; k < pool.length; k++) {
          if (pool[k].active) continue;
          const sp = pool[k];
          const tang = Math.abs(v);
          sp.x = head.x + (Math.random() - 0.5) * 6;
          sp.y = head.y;
          // opposite the travel direction, with lateral scatter
          sp.vx = -Math.cos((angle * Math.PI) / 180) * tang * 0.02 * Math.sign(v)
            + (Math.random() - 0.5) * 1.6;
          sp.vy = -Math.sin((angle * Math.PI) / 180) * tang * 0.02 * Math.sign(v)
            + (Math.random() - 0.5) * 1.6;
          sp.age = 0;
          sp.life = 0.35 + Math.random() * 0.35;
          sp.active = true;
          break;
        }
      }
      for (let k = 0; k < pool.length; k++) {
        const sp = pool[k];
        const el = sparkRefs.current[k];
        if (!el) continue;
        if (!sp.active) {
          if (el.style.opacity !== '0') el.style.opacity = '0';
          continue;
        }
        sp.age += dt;
        if (sp.age >= sp.life) {
          sp.active = false;
          el.style.opacity = '0';
          continue;
        }
        sp.x += sp.vx * dt * 60;
        sp.y += sp.vy * dt * 60;
        const fade = 1 - sp.age / sp.life;
        el.setAttribute('cx', String(sp.x));
        el.setAttribute('cy', String(sp.y));
        el.style.opacity = String(fade * 0.8);
        el.style.fill = trailColorAt(sp.y / totalHeight);
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      journey.cometOn = false;
    };
  }, [totalPathLength, totalHeight, anchors]);

  const ready = totalPathLength > 0;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${totalHeight}px`,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* World-space altitude gradient shared by every trail layer */}
        <linearGradient
          id="trail-grad"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2={totalHeight}
        >
          {TRAIL_STOPS.map((stop) => (
            <stop
              key={stop.u}
              offset={`${stop.u * 100}%`}
              stopColor={stop.color}
            />
          ))}
        </linearGradient>

        <radialGradient id="dot-warm-grad">
          <stop offset="0%" stopColor="rgba(255, 231, 190, 0.8)" />
          <stop offset="38%" stopColor="rgba(224, 178, 110, 0.24)" />
          <stop offset="100%" stopColor="rgba(224, 178, 110, 0)" />
        </radialGradient>
        <radialGradient id="dot-cool-grad">
          <stop offset="0%" stopColor="rgba(186, 236, 226, 0.8)" />
          <stop offset="38%" stopColor="rgba(63, 168, 152, 0.24)" />
          <stop offset="100%" stopColor="rgba(63, 168, 152, 0)" />
        </radialGradient>
        <radialGradient id="node-glow-grad">
          <stop offset="0%" stopColor="rgba(255, 236, 200, 0.55)" />
          <stop offset="100%" stopColor="rgba(255, 236, 200, 0)" />
        </radialGradient>
        <linearGradient id="streak-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="-90" y2="0">
          <stop offset="0%" stopColor="rgba(255, 244, 222, 0.85)" />
          <stop offset="100%" stopColor="rgba(255, 244, 222, 0)" />
        </linearGradient>
      </defs>

      {/* Hidden measurement twin — keeps visible layers free of layout reads */}
      <path ref={measureRef} d={pathString} fill="none" stroke="none" />

      <g opacity={ready ? 1 : 0} style={{ transition: 'opacity 0.4s ease' }}>
        {/* Wake: one wide soft under-glow (layered strokes, no filters) */}
        <path
          ref={glowWideRef}
          d={pathString}
          stroke="url(#trail-grad)"
          strokeWidth={16}
          strokeLinecap="round"
          fill="none"
          opacity={0.055}
          strokeDasharray={totalPathLength || 1}
          strokeDashoffset={totalPathLength || 1}
        />
        <path
          ref={glowTightRef}
          d={pathString}
          stroke="url(#trail-grad)"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={0.14}
          strokeDasharray={totalPathLength || 1}
          strokeDashoffset={totalPathLength || 1}
        />
        {/* near-white 1px core, low opacity — reads as light, not neon */}
        <path
          ref={coreRef}
          d={pathString}
          stroke="#F4EFE2"
          strokeWidth={1.1}
          strokeLinecap="round"
          fill="none"
          opacity={0.42}
          strokeDasharray={totalPathLength || 1}
          strokeDashoffset={totalPathLength || 1}
        />
        {/* the wake cools with distance: hot only just behind the head */}
        <path
          ref={hotRef}
          d={pathString}
          stroke="url(#trail-grad)"
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
          strokeDasharray={`${HOT_TAIL_PX} ${totalPathLength || 1}`}
          strokeDashoffset={HOT_TAIL_PX}
        />
        <path
          ref={hotInnerRef}
          d={pathString}
          stroke="#FFF6E4"
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
          opacity={0.65}
          strokeDasharray={`${HOT_INNER_PX} ${totalPathLength || 1}`}
          strokeDashoffset={HOT_INNER_PX}
        />

        {/* Anchor nodes — invisible until the comet is ~1 viewport away */}
        {anchors.map((anchor, i) => {
          const color = trailColorAt(anchor.y / totalHeight);
          const towardCard = anchor.side === 'right' ? 20 : -20;
          return (
            <g
              key={anchor.id}
              ref={(el) => { anchorGroupRefs.current[i] = el; }}
              transform={`translate(${anchor.x}, ${anchor.y}) scale(0.55)`}
              style={{ opacity: 0 }}
            >
              <circle
                ref={(el) => { rippleRefs.current[i] = el; }}
                r={6}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0}
              />
              <line
                ref={(el) => { connectorRefs.current[i] = el; }}
                x1={0}
                y1={0}
                x2={towardCard}
                y2={0}
                stroke={color}
                strokeWidth={1}
                opacity={0.6}
                style={{
                  transform: 'scaleX(0)',
                  transition: `transform 0.45s ${EASE_ARRIVE_CSS}`,
                }}
              />
              <circle
                ref={(el) => { haloRefs.current[i] = el; }}
                r={13}
                fill="url(#node-glow-grad)"
                opacity={0}
                style={{ transition: 'opacity 0.6s ease' }}
              />
              <circle
                ref={(el) => { ringRefs.current[i] = el; }}
                r={4}
                fill="#05070D"
                stroke={color}
                strokeWidth={1.3}
                opacity={0.55}
                style={{ transition: 'opacity 0.6s ease' }}
              />
              <circle
                ref={(el) => { nodeCoreRefs.current[i] = el; }}
                r={1.6}
                fill={color}
                opacity={0}
                style={{ transition: 'opacity 0.6s ease' }}
              />
            </g>
          );
        })}

        {/* Sparks shed at the head */}
        <g>
          {Array.from({ length: SPARK_POOL }, (_, k) => (
            <circle
              key={k}
              ref={(el) => { sparkRefs.current[k] = el; }}
              r={1.1}
              fill="#FFE9C4"
              style={{ opacity: 0 }}
            />
          ))}
        </g>

        {/* Comet head */}
        <g ref={dotGroupRef}>
          <g ref={igniteRef}>
            <g ref={parallaxRef}>
              <circle ref={dotWarmRef} r={15} fill="url(#dot-warm-grad)" />
              <circle
                ref={dotCoolRef}
                r={15}
                fill="url(#dot-cool-grad)"
                style={{ opacity: 0 }}
              />
            </g>
            <g ref={tangentRef}>
              <line
                ref={streakRef}
                x1={0}
                y1={0}
                x2={0}
                y2={0}
                stroke="url(#streak-grad)"
                strokeWidth={2.4}
                strokeLinecap="round"
                style={{ opacity: 0 }}
              />
            </g>
            <circle ref={pingRef} r={6} fill="none" stroke="#EADCBC" strokeWidth={0.8} opacity={0} />
            <circle
              ref={dotRingRef}
              className="comet-ring"
              r={4.5}
              fill="none"
              stroke="#EADCBC"
              strokeWidth={0.7}
            />
            <circle r={2.1} fill="#FFFDF4" />
          </g>
          <circle ref={flareRef} r={11} fill="url(#dot-warm-grad)" opacity={0} />
        </g>
      </g>
    </svg>
  );
}
