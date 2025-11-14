'use client';

import { useEffect, useRef, useState } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import {
  TRAIL_STOPS,
  trailColorAt,
  cometScreenVhMobile,
  waterlineScreenVh,
  smoothstep,
  CROSS_T,
} from '@/lib/descent';
import { journey, plungeElapsed, buoyancyVh } from '@/lib/journey';
import { motionAllowed, EASE_ARRIVE_CSS } from '@/lib/motion';
import { activeSections, sectionCenterFractionMobile } from '@/lib/activeSections';
import { MOBILE_GUTTER_VW } from '@/config/world';

// A3 — the probe's wake on a phone: slimmed to a side gutter the cards
// indent off. Desktop rules carry over wholesale: NOTHING renders ahead of
// the comet, anchors materialise on approach and ripple once when passed,
// connectors draw toward the card, the head cools warm→teal at the actual
// on-screen waterline. A6: the comet's screen position eases with a heavier
// lag underwater, so the medium change is FELT as visual drag even though
// touch scrolling stays native.

const HOT_TAIL_PX = 170;
const SWAY_FRACTION = 0.035; // gentle S: control-point offset as a fraction of width

interface Geometry {
  d: string;
  anchors: { id: string; x: number; y: number }[];
  width: number;
  height: number;
}

export default function MobileSpine() {
  const svgRef = useRef<SVGSVGElement>(null);
  const measureRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const coreRef = useRef<SVGPathElement>(null);
  const hotRef = useRef<SVGPathElement>(null);

  const dotGroupRef = useRef<SVGGElement>(null);
  const igniteRef = useRef<SVGGElement>(null);
  const dotWarmRef = useRef<SVGCircleElement>(null);
  const dotCoolRef = useRef<SVGCircleElement>(null);
  const dotRingRef = useRef<SVGCircleElement>(null);
  const tangentRef = useRef<SVGGElement>(null);
  const streakRef = useRef<SVGLineElement>(null);

  const anchorGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const rippleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const haloRefs = useRef<(SVGCircleElement | null)[]>([]);
  const ringRefs = useRef<(SVGCircleElement | null)[]>([]);
  const nodeCoreRefs = useRef<(SVGCircleElement | null)[]>([]);
  const connectorRefs = useRef<(SVGLineElement | null)[]>([]);
  const passedState = useRef<boolean[]>([]);

  const [geo, setGeo] = useState<Geometry | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const samplesRef = useRef<{ xs: Float32Array; ys: Float32Array } | null>(null);
  const anchorLengthsRef = useRef<number[]>([]);

  // Geometry from the measured container — the world's height is CSS-resolved
  // (svh), so it is read back in px rather than derived from constants.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const generate = () => {
      const svg = svgRef.current;
      if (!svg) return;
      const height = svg.clientHeight;
      const width = window.innerWidth;
      if (!height || !width) return;

      const gx = (width * MOBILE_GUTTER_VW) / 100;
      const anchors = activeSections.map((section) => ({
        id: section.id,
        x: gx,
        y: sectionCenterFractionMobile(section.index) * height,
      }));

      // gentle S — both control points of each segment lean the same way,
      // alternating sides, so the wake drifts without leaving the gutter
      const parts: string[] = [`M ${gx} 0`];
      let prevY = 0;
      anchors.forEach((anchor, i) => {
        const sway = width * SWAY_FRACTION * (i % 2 === 0 ? 1 : -1);
        const c = Math.min(260, Math.max(80, (anchor.y - prevY) * 0.4));
        parts.push(`C ${gx + sway} ${prevY + c}, ${gx + sway} ${anchor.y - c}, ${gx} ${anchor.y}`);
        prevY = anchor.y;
      });
      const lastSway = width * SWAY_FRACTION * (anchors.length % 2 === 0 ? 1 : -1);
      parts.push(`C ${gx + lastSway} ${prevY + 220}, ${gx} ${height - 220}, ${gx} ${height}`);

      setGeo({ d: parts.join(' '), anchors, width, height });
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
  }, []);

  // Measure + sample the geometry (same table trick as desktop — no
  // getPointAtLength in the frame loop)
  useEffect(() => {
    const path = measureRef.current;
    if (!path || !geo) return;

    const length = path.getTotalLength();
    const sampleCount = Math.min(500, Math.max(160, Math.ceil(length / 10)));
    const xs = new Float32Array(sampleCount + 1);
    const ys = new Float32Array(sampleCount + 1);
    for (let i = 0; i <= sampleCount; i++) {
      const p = path.getPointAtLength((length * i) / sampleCount);
      xs[i] = p.x;
      ys[i] = p.y;
    }
    samplesRef.current = { xs, ys };

    const anchorLengths: number[] = [];
    let cursor = 0;
    for (const anchor of geo.anchors) {
      while (cursor < sampleCount && ys[cursor] < anchor.y) cursor++;
      anchorLengths.push((cursor / sampleCount) * length);
    }
    anchorLengthsRef.current = anchorLengths;
    passedState.current = geo.anchors.map(() => false);

    setPathLength(length);
  }, [geo]);

  // Ignition — the comet lights as the veil lifts, same beat as desktop
  useEffect(() => {
    const unsubscribe = useSiteStore.subscribe(
      (state) => state.isLoading,
      (isLoading) => {
        if (isLoading || !motionAllowed()) return;
        const ignite = igniteRef.current;
        if (ignite) {
          ignite.style.transformBox = 'fill-box';
          ignite.style.transformOrigin = 'center';
          ignite.animate(
            [
              { transform: 'scale(0.2)', opacity: 0 },
              { transform: 'scale(1.35)', opacity: 1, offset: 0.55 },
              { transform: 'scale(1)', opacity: 1 },
            ],
            { duration: 950, easing: EASE_ARRIVE_CSS, fill: 'forwards' },
          );
        }
        unsubscribe();
      },
    );
    return () => unsubscribe();
  }, []);

  // Frame loop — imperative attribute writes only
  useEffect(() => {
    if (pathLength === 0 || !geo) return;

    const allowMotion = motionAllowed();
    const L = pathLength;
    const H = geo.height;
    let easedVh: number | null = null;
    let rafId = 0;

    const arcAtPageY = (targetY: number): number => {
      const ys = samplesRef.current!.ys;
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

      const t = useSiteStore.getState().scrollT;
      const vh = window.innerHeight;

      // A6 — heavier medium: above the surface the screen position tracks
      // tightly; underwater it drags behind the hand and settles late
      const targetVh = cometScreenVhMobile(t);
      if (easedVh === null || !allowMotion) {
        easedVh = targetVh;
      } else {
        const uw = smoothstep(CROSS_T - 0.06, CROSS_T + 0.09, t);
        easedVh += (targetVh - easedVh) * (0.42 - 0.3 * uw);
      }

      // C2 — buoyancy rides on top of the eased position (not through it:
      // the underwater lag would smear the rebound into mush)
      const buoy = allowMotion ? buoyancyVh(plungeElapsed(performance.now())) : 0;

      const targetY = Math.min(H, Math.max(0, window.scrollY + ((easedVh + buoy) / 100) * vh));
      const s = arcAtPageY(targetY);
      const head = pointAtArc(s);

      // export the probe's screen position for the WebGL layers
      const screenY = head.y - window.scrollY;
      journey.cometX = head.x;
      journey.cometY = screenY;
      journey.cometOn = true;

      const offset = String(L - s);
      if (glowRef.current) glowRef.current.style.strokeDashoffset = offset;
      if (coreRef.current) coreRef.current.style.strokeDashoffset = offset;
      if (hotRef.current) hotRef.current.style.strokeDashoffset = String(HOT_TAIL_PX - s);

      if (dotGroupRef.current)
        dotGroupRef.current.setAttribute('transform', `translate(${head.x}, ${head.y})`);

      // warm above the surface, cool below — against the on-screen waterline
      // (buoyed like the shader's, so the flip lands on the beat)
      const waterY = ((waterlineScreenVh(t) - buoy) / 100) * vh;
      const cool = Math.min(1, Math.max(0, (screenY - waterY + 30) / 60));
      if (dotWarmRef.current) dotWarmRef.current.style.opacity = String(1 - cool);
      if (dotCoolRef.current) dotCoolRef.current.style.opacity = String(cool);
      if (dotRingRef.current) dotRingRef.current.style.stroke = trailColorAt(head.y / H);

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
          `translate(${geo.anchors[a]?.x ?? 0}, ${geo.anchors[a]?.y ?? 0}) scale(${scale})`,
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
                  { transform: 'scale(4.2)', opacity: 0 },
                ],
                { duration: 750, easing: EASE_ARRIVE_CSS },
              );
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
      const speed = Math.min(64, Math.abs(v) * 1.05);
      if (tangentRef.current)
        tangentRef.current.setAttribute('transform', `rotate(${v >= 0 ? angle : angle + 180})`);
      if (streakRef.current) {
        streakRef.current.setAttribute('x2', String(-speed));
        streakRef.current.style.opacity = String(Math.min(0.5, Math.abs(v) * 0.013));
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      journey.cometOn = false;
    };
  }, [pathLength, geo]);

  const ready = pathLength > 0;

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="m-trail-grad"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2={geo?.height ?? 1}
        >
          {TRAIL_STOPS.map((stop) => (
            <stop key={stop.u} offset={`${stop.u * 100}%`} stopColor={stop.color} />
          ))}
        </linearGradient>
        <radialGradient id="m-dot-warm-grad">
          <stop offset="0%" stopColor="rgba(255, 231, 190, 0.8)" />
          <stop offset="38%" stopColor="rgba(224, 178, 110, 0.24)" />
          <stop offset="100%" stopColor="rgba(224, 178, 110, 0)" />
        </radialGradient>
        <radialGradient id="m-dot-cool-grad">
          <stop offset="0%" stopColor="rgba(186, 236, 226, 0.8)" />
          <stop offset="38%" stopColor="rgba(63, 168, 152, 0.24)" />
          <stop offset="100%" stopColor="rgba(63, 168, 152, 0)" />
        </radialGradient>
        <radialGradient id="m-node-glow-grad">
          <stop offset="0%" stopColor="rgba(255, 236, 200, 0.55)" />
          <stop offset="100%" stopColor="rgba(255, 236, 200, 0)" />
        </radialGradient>
        <linearGradient
          id="m-streak-grad"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="-64"
          y2="0"
        >
          <stop offset="0%" stopColor="rgba(255, 244, 222, 0.85)" />
          <stop offset="100%" stopColor="rgba(255, 244, 222, 0)" />
        </linearGradient>
      </defs>

      {/* Hidden measurement twin */}
      <path ref={measureRef} d={geo?.d ?? ''} fill="none" stroke="none" />

      <g opacity={ready ? 1 : 0} style={{ transition: 'opacity 0.4s ease' }}>
        {/* Wake: one soft under-glow + the near-white core */}
        <path
          ref={glowRef}
          d={geo?.d ?? ''}
          stroke="url(#m-trail-grad)"
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
          opacity={0.08}
          strokeDasharray={pathLength || 1}
          strokeDashoffset={pathLength || 1}
        />
        <path
          ref={coreRef}
          d={geo?.d ?? ''}
          stroke="#F4EFE2"
          strokeWidth={1}
          strokeLinecap="round"
          fill="none"
          opacity={0.4}
          strokeDasharray={pathLength || 1}
          strokeDashoffset={pathLength || 1}
        />
        {/* hot only just behind the head — the wake cools with distance */}
        <path
          ref={hotRef}
          d={geo?.d ?? ''}
          stroke="url(#m-trail-grad)"
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
          strokeDasharray={`${HOT_TAIL_PX} ${pathLength || 1}`}
          strokeDashoffset={HOT_TAIL_PX}
        />

        {/* Anchor nodes — invisible until the comet is ~1 viewport away */}
        {(geo?.anchors ?? []).map((anchor, i) => {
          const color = trailColorAt(anchor.y / (geo?.height || 1));
          return (
            <g
              key={anchor.id}
              ref={(el) => {
                anchorGroupRefs.current[i] = el;
              }}
              transform={`translate(${anchor.x}, ${anchor.y}) scale(0.55)`}
              style={{ opacity: 0 }}
            >
              <circle
                ref={(el) => {
                  rippleRefs.current[i] = el;
                }}
                r={6}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0}
              />
              <line
                ref={(el) => {
                  connectorRefs.current[i] = el;
                }}
                x1={0}
                y1={0}
                x2={22}
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
                ref={(el) => {
                  haloRefs.current[i] = el;
                }}
                r={12}
                fill="url(#m-node-glow-grad)"
                opacity={0}
                style={{ transition: 'opacity 0.6s ease' }}
              />
              <circle
                ref={(el) => {
                  ringRefs.current[i] = el;
                }}
                r={3.6}
                fill="#05070D"
                stroke={color}
                strokeWidth={1.2}
                opacity={0.55}
                style={{ transition: 'opacity 0.6s ease' }}
              />
              <circle
                ref={(el) => {
                  nodeCoreRefs.current[i] = el;
                }}
                r={1.4}
                fill={color}
                opacity={0}
                style={{ transition: 'opacity 0.6s ease' }}
              />
            </g>
          );
        })}

        {/* Comet head */}
        <g ref={dotGroupRef}>
          <g ref={igniteRef}>
            <circle ref={dotWarmRef} r={13} fill="url(#m-dot-warm-grad)" />
            <circle ref={dotCoolRef} r={13} fill="url(#m-dot-cool-grad)" style={{ opacity: 0 }} />
            <g ref={tangentRef}>
              <line
                ref={streakRef}
                x1={0}
                y1={0}
                x2={0}
                y2={0}
                stroke="url(#m-streak-grad)"
                strokeWidth={2}
                strokeLinecap="round"
                style={{ opacity: 0 }}
              />
            </g>
            <circle
              ref={dotRingRef}
              className="comet-ring"
              r={4}
              fill="none"
              stroke="#EADCBC"
              strokeWidth={0.7}
            />
            <circle r={1.9} fill="#FFFDF4" />
          </g>
        </g>
      </g>
    </svg>
  );
}
