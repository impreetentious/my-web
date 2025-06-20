import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#05060D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      padding: '24px',
    }}>
      <p style={{
        fontSize: '10px', letterSpacing: '0.25em',
        color: '#444444', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono), monospace',
      }}>
        — 404 —
      </p>
      <h1 style={{
        fontSize: '36px', color: '#F2F2F2',
        fontFamily: 'var(--font-sans), sans-serif',
        fontWeight: 300, margin: 0,
      }}>
        Signal lost.
      </h1>
      <p style={{
        fontSize: '14px', color: '#888888',
        maxWidth: '320px', textAlign: 'center', lineHeight: 1.7, margin: 0,
        fontFamily: 'var(--font-sans), sans-serif',
      }}>
        This page doesn&apos;t exist. The spine doesn&apos;t reach here.
      </p>
      <Link href="/" style={{
        marginTop: '12px', padding: '10px 24px',
        border: '1px solid rgba(0, 255, 238, 0.25)',
        borderRadius: '4px', color: '#00FFEE',
        fontSize: '11px', fontFamily: 'var(--font-mono), monospace',
        textDecoration: 'none', letterSpacing: '0.12em',
      }}>
        ← return to surface
      </Link>
    </main>
  );
}
