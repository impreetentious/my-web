'use client';

import { useState } from 'react';
import site from '@/content/site.json';

// C15 — the contact plate carries a transmit mark, not a stock envelope: a
// source point firing two arcs toward the sky. Hover completes the send —
// the arcs light in sequence and a signal dot leaves the dish.
export default function EmailIcon() {
  const [hover, setHover] = useState(false);

  // A9 — hidden below the breakpoint (CSS .email-fab): fixed bottom-right
  // overlapped full-width cards on phones; the contact affordance lives in
  // the footer's social row there instead.
  return (
    <a
      className="email-fab"
      href={`mailto:${site.email}`}
      aria-label="Send me an email"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '42px',
        height: '42px',
        borderRadius: '4px',
        border: `1px solid ${hover ? 'rgba(0, 255, 238, 0.7)' : 'rgba(0, 255, 238, 0.2)'}`,
        background: 'rgba(8, 8, 8, 0.8)',
        backdropFilter: 'blur(8px)',
        color: hover ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        transition: 'border-color 0.25s ease, color 0.25s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
        {/* dish — a grounded chevron */}
        <path
          d="M 3.5 13.5 L 6.8 10.2 M 3 10.6 L 3.5 13.5 L 6.4 14"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        {/* signal arcs, lighting in sequence on hover */}
        <path
          d="M 8.4 8.6 A 3.4 3.4 0 0 1 10.9 11.2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          style={{ opacity: hover ? 1 : 0.55, transition: 'opacity 0.2s ease 0s' }}
        />
        <path
          d="M 9.9 6.1 A 6.6 6.6 0 0 1 13.4 9.7"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          style={{ opacity: hover ? 1 : 0.3, transition: 'opacity 0.2s ease 0.07s' }}
        />
        {/* the packet — leaves the dish when the send completes */}
        <circle
          cx="12.6"
          cy="3.6"
          r="1.3"
          fill="currentColor"
          style={{
            opacity: hover ? 1 : 0.18,
            transform: hover ? 'translate(1.2px, -1.2px)' : 'translate(0, 0)',
            transition: 'opacity 0.25s ease 0.14s, transform 0.35s cubic-bezier(0.16, 0.84, 0.24, 1) 0.14s',
          }}
        />
      </svg>
    </a>
  );
}
