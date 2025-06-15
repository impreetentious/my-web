'use client';

import { useEffect, useRef, useState } from 'react';
import { generateSpinePath } from '@/lib/spinePathGenerator';
import { useSiteStore } from '@/store/useSiteStore';
import type { SpineAnchor } from '@/types';

interface SpineSVGProps {
  totalHeight: number;
}

export default function SpineSVG({ totalHeight }: SpineSVGProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const [pathString, setPathString] = useState('');
  const [anchors, setAnchors] = useState<SpineAnchor[]>([]);
  const [totalPathLength, setTotalPathLength] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  // Generate the path on mount and regenerate on (debounced) resize
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const generate = () => {
      setViewportWidth(window.innerWidth);
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

  // Measure the real path length once the path exists in the DOM
  useEffect(() => {
    if (!pathRef.current || !pathString) return;
    setTotalPathLength(pathRef.current.getTotalLength());
  }, [pathString]);

  // Scroll-driven updates via direct DOM manipulation — never useState here (perf)
  useEffect(() => {
    if (!pathRef.current || !dotRef.current || totalPathLength === 0) return;

    const unsubscribe = useSiteStore.subscribe(
      (state) => state.scrollT,
      (scrollT) => {
        const offset = totalPathLength * (1 - scrollT);
        pathRef.current!.style.strokeDashoffset = String(offset);
        const point = pathRef.current!.getPointAtLength(scrollT * totalPathLength);
        dotRef.current!.setAttribute('cx', String(point.x));
        dotRef.current!.setAttribute('cy', String(point.y));
      }
    );

    return () => unsubscribe();
  }, [totalPathLength]);

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
        <filter id="spine-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Layer A — dim static base path */}
      <path
        d={pathString}
        stroke="#1C1C1C"
        strokeWidth={1.5}
        fill="none"
        opacity={1}
      />

      {/* Layer B — travelling cyan pulse */}
      <path
        d={pathString}
        stroke="#00FFEE"
        strokeWidth={2}
        fill="none"
        filter="url(#spine-glow)"
        strokeDasharray="60 30"
        opacity={0.7}
        style={{ animation: 'spine-pulse 1.6s linear infinite' }}
      />

      {/* Layer C — scroll progress fill (hidden until path length is known, R05) */}
      <path
        ref={pathRef}
        d={pathString}
        stroke="#00FFEE"
        strokeWidth={1.5}
        fill="none"
        filter="url(#spine-glow)"
        strokeDasharray={totalPathLength}
        strokeDashoffset={totalPathLength}
        opacity={totalPathLength > 0 ? 0.5 : 0}
      />

      {/* Anchor nodes — one per section anchor point */}
      {anchors.map((anchor) => (
        <circle
          key={anchor.id}
          cx={anchor.x}
          cy={anchor.y}
          r={3}
          fill="#080808"
          stroke="#00FFEE"
          strokeWidth={1.5}
          filter="url(#spine-glow)"
          opacity={0.6}
        />
      ))}

      {/* Scroll position dot (same first-frame flash guard as Layer C) */}
      <circle
        ref={dotRef}
        cx={viewportWidth / 2}
        cy={0}
        r={5}
        fill="#00FFEE"
        filter="url(#spine-glow)"
        opacity={totalPathLength > 0 ? 1 : 0}
      />
    </svg>
  );
}
