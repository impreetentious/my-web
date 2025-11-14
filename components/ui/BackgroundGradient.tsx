'use client';

import { useEffect, useRef } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { zoneWeights, waterlineScreenVh } from '@/lib/descent';
import { PLUNGE_EVENT } from '@/lib/journey';
import { motionAllowed } from '@/lib/motion';

// The real sky lives in the WebGL fragment shader (SkyOcean). This layer is
// (a) a static backstop under the canvas while a shader tier runs, and
// (b) the FULL scroll-driven fallback world whenever quality is 'low' — no
// WebGL, an fps demotion, or a lost context — on desktop and mobile alike
// (B3/A2). The fallback animates, carries grain in place of the shader's
// dither, and dips its palette on the plunge (A5).

const GRAIN_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const layerBase: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  willChange: 'opacity',
};

export default function BackgroundGradient() {
  const active = useSiteStore((s) => s.quality === 'low');
  const spaceRef = useRef<HTMLDivElement>(null);
  const duskRef = useRef<HTMLDivElement>(null);
  const seaRef = useRef<HTMLDivElement>(null);
  const abyssRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const waterRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const dipRef = useRef<HTMLDivElement>(null);

  // Scroll-driven layer mix — only while this stack IS the world
  useEffect(() => {
    if (!active) return;

    const apply = (t: number) => {
      const w = zoneWeights(t);
      if (spaceRef.current) spaceRef.current.style.opacity = String(w.space);
      if (duskRef.current) duskRef.current.style.opacity = String(w.dusk);
      if (seaRef.current) seaRef.current.style.opacity = String(w.sea);
      if (abyssRef.current) abyssRef.current.style.opacity = String(w.abyss);
      if (raysRef.current) raysRef.current.style.opacity = String(w.rays * 0.4);
      if (waterRef.current)
        waterRef.current.style.transform = `translateY(${waterlineScreenVh(t)}vh)`;
      if (vignetteRef.current) vignetteRef.current.style.opacity = String(0.45 + t * 0.4);
    };

    apply(useSiteStore.getState().scrollT);
    const unsubscribe = useSiteStore.subscribe((s) => s.scrollT, apply);

    // A5 — the plunge on the fallback world: a brief palette dip standing in
    // for the shader's shock envelope
    const onPlunge = () => {
      if (!motionAllowed() || !dipRef.current) return;
      dipRef.current.animate([{ opacity: 0 }, { opacity: 0.4, offset: 0.18 }, { opacity: 0 }], {
        duration: 950,
        easing: 'ease-out',
      });
    };
    window.addEventListener(PLUNGE_EVENT, onPlunge);

    return () => {
      unsubscribe();
      window.removeEventListener(PLUNGE_EVENT, onPlunge);
    };
  }, [active]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#05060D',
      }}
    >
      {/* Orbit backstop — also all the DOM ever shows behind a live canvas */}
      <div
        ref={spaceRef}
        style={{
          ...layerBase,
          opacity: 1,
          background: `
            radial-gradient(ellipse 120% 80% at 72% -12%, rgba(48, 56, 104, 0.16), transparent 55%),
            radial-gradient(ellipse 90% 70% at 18% 32%, rgba(26, 58, 96, 0.12), transparent 60%),
            linear-gradient(180deg, #05060D 0%, #060A14 55%, #0A1424 100%)`,
        }}
      />

      {active && (
        <>
          {/* High atmosphere → dusk, a restrained warm hint low in the frame */}
          <div
            ref={duskRef}
            style={{
              ...layerBase,
              opacity: 0,
              background: `
                radial-gradient(ellipse 140% 55% at 50% 110%, rgba(224, 178, 110, 0.12), transparent 62%),
                linear-gradient(180deg, #060A16 0%, #0A1A2F 45%, #122740 78%, #17304E 100%)`,
            }}
          />

          {/* Just under the surface */}
          <div
            ref={seaRef}
            style={{
              ...layerBase,
              opacity: 0,
              background: `
                radial-gradient(ellipse 130% 60% at 50% -18%, rgba(90, 165, 180, 0.14), transparent 60%),
                linear-gradient(180deg, #0B3C4A 0%, #062633 45%, #03161F 100%)`,
            }}
          />

          {/* The deep */}
          <div
            ref={abyssRef}
            style={{
              ...layerBase,
              opacity: 0,
              background: `
                radial-gradient(ellipse 120% 50% at 50% -25%, rgba(36, 100, 116, 0.09), transparent 55%),
                linear-gradient(180deg, #021A21 0%, #011016 50%, #010A10 100%)`,
            }}
          />

          {/* Waterline sheet — softened v2: thin displaced-looking line, dim glow */}
          <div
            ref={waterRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '300vh',
              transform: 'translateY(175vh)',
              willChange: 'transform',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-24vh',
                left: 0,
                width: '100%',
                height: '24vh',
                background:
                  'linear-gradient(0deg, rgba(224, 178, 110, 0.16), rgba(224, 178, 110, 0.03) 55%, transparent)',
              }}
            />
            <div
              className="waterline-shimmer"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '1.5px',
                background:
                  'linear-gradient(90deg, transparent 2%, rgba(224,186,124,0.42) 28%, rgba(240,222,182,0.85) 50%, rgba(224,186,124,0.42) 72%, transparent 98%)',
                boxShadow: '0 0 14px 2px rgba(214, 168, 100, 0.25)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '1.5px',
                left: 0,
                width: '100%',
                height: 'calc(300vh - 1.5px)',
                background:
                  'linear-gradient(180deg, rgba(11, 60, 74, 0.97) 0%, rgba(6, 38, 51, 0.98) 22%, rgba(3, 22, 31, 1) 55%, rgba(1, 10, 16, 1) 100%)',
              }}
            />
          </div>

          {/* God rays, visible only underwater */}
          <div
            ref={raysRef}
            className="god-rays"
            style={{
              position: 'absolute',
              top: '-10vh',
              left: '-20vw',
              width: '140vw',
              height: '120vh',
              opacity: 0,
              background: `repeating-linear-gradient(
                78deg,
                transparent 0px,
                transparent 90px,
                rgba(107, 184, 199, 0.09) 130px,
                transparent 180px,
                transparent 260px
              )`,
              WebkitMaskImage:
                'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 40%, transparent 78%)',
              maskImage:
                'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 40%, transparent 78%)',
              willChange: 'opacity, transform',
            }}
          />

          {/* Plunge palette dip (A5) — flashed dark by the WAAPI burst above */}
          <div
            ref={dipRef}
            style={{
              ...layerBase,
              opacity: 0,
              background: '#010609',
            }}
          />

          {/* Grain — the stand-in for shader dither; kills the poster look */}
          <div
            style={{
              ...layerBase,
              backgroundImage: GRAIN_TILE,
              backgroundSize: '160px 160px',
              opacity: 0.05,
              mixBlendMode: 'overlay',
            }}
          />

          {/* Vignette, deepening with descent */}
          <div
            ref={vignetteRef}
            style={{
              ...layerBase,
              opacity: 0.45,
              background:
                'radial-gradient(ellipse 130% 105% at 50% 42%, transparent 52%, rgba(0, 0, 0, 0.6) 100%)',
            }}
          />
        </>
      )}
    </div>
  );
}
