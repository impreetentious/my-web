import { ImageResponse } from 'next/og';

// comet/waterline mark. Multiple sizes via generateImageMetadata.
export function generateImageMetadata() {
  return [
    { contentType: 'image/png', size: { width: 16, height: 16 }, id: '16' },
    { contentType: 'image/png', size: { width: 32, height: 32 }, id: '32' },
  ];
}

export default async function Icon({ id }: { id: string }) {
  const size = Number(id) || 32;
  return renderMark(size);
}

function renderMark(size: number) {
  const waterY = Math.round(size * 0.62);
  const cometX = Math.round(size * 0.58);
  const trailH = Math.round(size * 0.48);
  const head = Math.max(2, Math.round(size * 0.14));

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: '#05060D',
      }}
    >
      {/* waterline glow */}
      <div
        style={{
          position: 'absolute',
          left: Math.round(size * 0.08),
          right: Math.round(size * 0.08),
          top: waterY - Math.max(1, Math.round(size * 0.06)),
          height: Math.max(2, Math.round(size * 0.14)),
          background:
            'linear-gradient(180deg, rgba(224,178,110,0) 0%, rgba(224,178,110,0.7) 45%, rgba(127,196,184,0.55) 55%, rgba(127,196,184,0) 100%)',
        }}
      />
      {/* wake trail */}
      <div
        style={{
          position: 'absolute',
          left: cometX,
          top: Math.round(size * 0.08),
          width: Math.max(1, Math.round(size * 0.06)),
          height: trailH,
          background:
            'linear-gradient(180deg, rgba(234,220,188,0) 0%, rgba(221,184,120,0.55) 55%, rgba(255,244,222,0.95) 100%)',
        }}
      />
      {/* comet head */}
      <div
        style={{
          position: 'absolute',
          left: cometX - Math.round(head / 2) + Math.round(size * 0.02),
          top: waterY - head - Math.round(size * 0.02),
          width: head,
          height: head,
          borderRadius: head,
          background: '#F4E6C8',
          boxShadow: `0 0 ${Math.max(2, Math.round(size * 0.12))}px rgba(224,178,110,0.85)`,
        }}
      />
    </div>,
    { width: size, height: size },
  );
}
