'use client';

export default function FooterSection() {
  const linkStyle: React.CSSProperties = {
    color: '#444444',
    transition: 'color 0.25s ease',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '300px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      pointerEvents: 'auto',
    }}>
      {/* Vertical fade-in line */}
      <div style={{
        width: '1px',
        height: '48px',
        background: 'linear-gradient(to bottom, transparent, rgba(0,255,238,0.25))',
      }} />

      {/* Social link row */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <a
          href="https://www.linkedin.com/in/sidakpreet-singh/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          style={linkStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#00FFEE'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
        >
          {/* LinkedIn SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect x="2" y="9" width="4" height="12"/>
            <circle cx="4" cy="4" r="2"/>
          </svg>
        </a>
        <a
          href="https://github.com/ItsMonarch04"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          style={linkStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#00FFEE'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
        >
          {/* GitHub SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
        </a>
      </div>

      {/* End tag */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        letterSpacing: '0.2em',
        color: '#2A2A2A',
        textTransform: 'uppercase',
      }}>
        — end of transmission —
      </p>
    </div>
  );
}
