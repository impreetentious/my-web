import Link from 'next/link';

// the lost-signal page keeps the fiction: film grain, one mote adrift
// in the dark, the display voice. The mote's drift keyframes live in
// globals.css (mote-drift) and collapse under prefers-reduced-motion.
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#05060D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="log-grain" aria-hidden="true" />

      {/* one mote, adrift */}
      <span
        aria-hidden="true"
        className="lost-mote"
        style={{
          position: 'absolute',
          left: '38%',
          top: '30%',
          width: '3px',
          height: '3px',
          borderRadius: '50%',
          background: 'rgba(127, 196, 184, 0.55)',
          boxShadow: '0 0 8px rgba(127, 196, 184, 0.35)',
        }}
      />

      <p
        style={{
          fontSize: '10px',
          letterSpacing: '0.25em',
          color: '#888888',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono), monospace',
        }}
      >
        — 404 —
      </p>
      <h1
        style={{
          fontSize: '44px',
          color: '#F2F2F2',
          fontFamily: 'var(--font-display), Georgia, serif',
          fontWeight: 400,
          margin: 0,
        }}
      >
        Signal lost.
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#888888',
          maxWidth: '320px',
          textAlign: 'center',
          lineHeight: 1.7,
          margin: 0,
          fontFamily: 'var(--font-sans), sans-serif',
        }}
      >
        This page doesn&apos;t exist. The spine doesn&apos;t reach here.
      </p>
      <Link
        href="/"
        style={{
          marginTop: '12px',
          padding: '10px 24px',
          border: '1px solid rgba(224, 178, 110, 0.35)',
          color: '#E0B26E',
          fontSize: '11px',
          fontFamily: 'var(--font-mono), monospace',
          textDecoration: 'none',
          letterSpacing: '0.12em',
        }}
      >
        ← return to surface
      </Link>
    </main>
  );
}
