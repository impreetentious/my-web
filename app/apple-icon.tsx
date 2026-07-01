import { ImageResponse } from 'next/og';

// apple-touch-icon (180). Same comet/waterline mark, larger canvas.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const sizePx = 180;
  const waterY = Math.round(sizePx * 0.62);
  const cometX = Math.round(sizePx * 0.58);
  const trailH = Math.round(sizePx * 0.48);
  const head = Math.round(sizePx * 0.12);

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
      <div
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          top: waterY - 10,
          height: 22,
          background:
            'linear-gradient(180deg, rgba(224,178,110,0) 0%, rgba(224,178,110,0.75) 45%, rgba(127,196,184,0.55) 55%, rgba(127,196,184,0) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: cometX,
          top: 18,
          width: 6,
          height: trailH,
          background:
            'linear-gradient(180deg, rgba(234,220,188,0) 0%, rgba(221,184,120,0.55) 55%, rgba(255,244,222,0.95) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: cometX - head / 2 + 2,
          top: waterY - head - 4,
          width: head,
          height: head,
          borderRadius: head,
          background: '#F4E6C8',
          boxShadow: '0 0 18px rgba(224,178,110,0.9)',
        }}
      />
    </div>,
    { ...size },
  );
}
