'use client';

import { Mail } from 'lucide-react';

export default function EmailIcon() {
  return (
    <a
      href="mailto:sps.daemon@gmail.com"
      aria-label="Send me an email"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '42px',
        height: '42px',
        borderRadius: '4px',
        border: '1px solid rgba(0, 255, 238, 0.2)',
        background: 'rgba(8, 8, 8, 0.8)',
        backdropFilter: 'blur(8px)',
        color: 'var(--color-text-secondary)',
        transition: 'border-color 0.25s ease, color 0.25s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,238,0.7)';
        (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,238,0.2)';
        (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
      }}
    >
      <Mail size={16} strokeWidth={1.5} />
    </a>
  );
}
