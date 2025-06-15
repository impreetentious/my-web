'use client';

export function PlaceholderPanel() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          color: 'var(--color-text-muted)',
        }}
      >
        This section is coming soon.
      </p>
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--color-accent)',
          animation: 'pulse-opacity 1.4s ease-in-out infinite',
        }}
      />
    </div>
  );
}
