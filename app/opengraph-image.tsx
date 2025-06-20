import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Sidakpreet Singh — Strategy & GTM';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        background: '#05060D', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '72px',
        position: 'relative', fontFamily: 'system-ui',
      }}>
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '3px', height: '100%',
          background: 'rgba(0, 255, 238, 0.5)',
        }} />
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
        {/* Accent label */}
        <p style={{
          color: '#00FFEE', fontSize: '13px', letterSpacing: '0.22em',
          textTransform: 'uppercase', marginBottom: '20px', fontFamily: 'monospace',
        }}>
          STRATEGY · GTM · PRODUCT
        </p>
        {/* Name */}
        <h1 style={{
          color: '#F2F2F2', fontSize: '76px', fontWeight: 300,
          lineHeight: 1.05, margin: '0 0 24px 0',
        }}>
          Sidakpreet Singh
        </h1>
        {/* Role */}
        <p style={{ color: '#888888', fontSize: '24px', fontWeight: 400, margin: 0 }}>
          Manager · HCLSoftware · IIM Indore MBA
        </p>
        {/* Domain */}
        <p style={{
          position: 'absolute', bottom: '72px', right: '72px',
          color: '#333333', fontSize: '13px', fontFamily: 'monospace',
          letterSpacing: '0.12em',
        }}>
          sidakpreet.in
        </p>
      </div>
    ),
    { ...size }
  );
}
