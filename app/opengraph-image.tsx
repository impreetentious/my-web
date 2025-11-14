import { ImageResponse } from 'next/og';
import site from '@/content/site.json';

// L7 — default nodejs runtime lets Next pre-render this route at build,
// so the deployment is literally static. The scene uses no external assets
// (satori CSS only), so edge offered no advantage.
export const alt = site.metaTitle;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// C15 — the link preview is the world itself: the golden-hour crossing with
// the probe about to pierce the line. Recruiters meet the descent before
// they ever click. Pure CSS gradients — satori renders no external assets.

const WATER_Y = 392; // px from top — the waterline sits in the lower third

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background:
          'linear-gradient(180deg, #05060D 0%, #070D1C 30%, #0B1B33 46%, #29344C 56%, #6E5638 60%, #C89158 62%, ' +
          '#0B3B44 62.4%, #07242E 74%, #04141C 100%)',
        fontFamily: 'sans-serif',
      }}
    >
      {/* stars */}
      {[
        [80, 60, 2, 0.8],
        [210, 130, 1.5, 0.5],
        [340, 40, 2, 0.6],
        [520, 100, 1.5, 0.4],
        [660, 170, 2, 0.7],
        [820, 60, 1.5, 0.5],
        [960, 140, 2, 0.6],
        [1100, 90, 1.5, 0.8],
        [420, 210, 1.5, 0.35],
        [1010, 240, 1.5, 0.4],
        [150, 260, 1.5, 0.3],
        [740, 280, 1.5, 0.35],
      ].map(([x, y, s, o], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: s,
            height: s,
            borderRadius: 99,
            background: `rgba(226, 234, 255, ${o})`,
          }}
        />
      ))}

      {/* the waterline — lit water with its glow */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: WATER_Y - 14,
          width: '100%',
          height: 28,
          background:
            'linear-gradient(180deg, rgba(240, 212, 155, 0) 0%, rgba(240, 212, 155, 0.55) 48%, rgba(240, 212, 155, 0.9) 50%, rgba(127, 196, 184, 0.4) 55%, rgba(127, 196, 184, 0) 100%)',
        }}
      />

      {/* the probe's wake — falling toward the line, tip on the glow */}
      <div
        style={{
          position: 'absolute',
          left: 926,
          top: -30,
          width: 3,
          height: 330,
          transform: 'rotate(14deg)',
          background:
            'linear-gradient(180deg, rgba(234, 220, 188, 0) 0%, rgba(221, 184, 120, 0.5) 55%, rgba(255, 244, 222, 0.95) 100%)',
        }}
      />
      {/* the probe */}
      <div
        style={{
          position: 'absolute',
          left: 848,
          top: 262,
          width: 84,
          height: 84,
          borderRadius: 99,
          background:
            'radial-gradient(circle, rgba(255, 253, 244, 1) 0%, rgba(255, 231, 190, 0.75) 12%, rgba(224, 178, 110, 0.28) 34%, rgba(224, 178, 110, 0) 70%)',
        }}
      />

      {/* underwater light shafts — faint, clear of the identity block */}
      <div
        style={{
          position: 'absolute',
          left: 850,
          top: WATER_Y + 8,
          width: 90,
          height: 190,
          transform: 'rotate(12deg)',
          background:
            'linear-gradient(180deg, rgba(66, 114, 120, 0.16) 0%, rgba(66, 114, 120, 0) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 990,
          top: WATER_Y + 4,
          width: 64,
          height: 150,
          transform: 'rotate(-9deg)',
          background:
            'linear-gradient(180deg, rgba(66, 114, 120, 0.13) 0%, rgba(66, 114, 120, 0) 100%)',
        }}
      />

      {/* identity block */}
      <div
        style={{
          position: 'absolute',
          left: 72,
          bottom: 96,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            color: '#E0B26E',
            fontSize: 15,
            letterSpacing: 8,
            marginBottom: 46, // clears the horizon band into dark sky
          }}
        >
          — SIGNAL RECEIVED —
        </div>
        <div
          style={{
            color: '#F5F2EA',
            fontSize: 78,
            fontWeight: 400,
            lineHeight: 1.02,
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            color: 'rgba(196, 212, 230, 0.75)',
            fontSize: 21,
            marginTop: 20,
            letterSpacing: 3,
          }}
        >
          {site.heroRoleLine.toUpperCase()}
        </div>
      </div>

      {/* depth ticker, bottom-right — the instrument signature */}
      <div
        style={{
          position: 'absolute',
          right: 72,
          bottom: 96,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ color: 'rgba(242, 242, 242, 0.85)', fontSize: 19, letterSpacing: 3 }}>
          ALT 0 KM
        </div>
        <div
          style={{
            color: 'rgba(140, 165, 175, 0.6)',
            fontSize: 13,
            letterSpacing: 4,
            marginTop: 8,
          }}
        >
          BREAKING SURFACE
        </div>
      </div>
    </div>,
    { ...size },
  );
}
