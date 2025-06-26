'use client';

import { useEffect, useRef } from 'react';
import { useSiteStore } from '@/store/useSiteStore';
import { altitudeKm, depthMetres } from '@/lib/descent';
import { journey } from '@/lib/journey';
import site from '@/content/site.json';

// The seafloor: a faint ridge silhouette, settled motes, a slow sonar ping
// behind the end tag — and the mission recap (§3.5.4), quiet live counters
// nobody's template has: distance fallen, transmissions decoded, time on
// mission. Numbers are written imperatively; no re-render per tick.

const MOTES: Array<{ left: string; bottom: number; size: number; o: number }> = [
  { left: '9%', bottom: 26, size: 2, o: 0.22 },
  { left: '18%', bottom: 14, size: 1.5, o: 0.16 },
  { left: '31%', bottom: 30, size: 2.5, o: 0.2 },
  { left: '44%', bottom: 12, size: 1.5, o: 0.14 },
  { left: '58%', bottom: 24, size: 2, o: 0.2 },
  { left: '69%', bottom: 15, size: 1.5, o: 0.15 },
  { left: '81%', bottom: 28, size: 2, o: 0.2 },
  { left: '92%', bottom: 18, size: 1.5, o: 0.16 },
];

function travelledKm(maxT: number): number {
  return altitudeKm(0) - altitudeKm(maxT) + depthMetres(maxT) / 1000;
}

export default function FooterSection() {
  const distanceRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const transmissions = useSiteStore((s) => s.openedPanelIds.length);

  useEffect(() => {
    const tick = () => {
      if (distanceRef.current) {
        distanceRef.current.textContent = `${travelledKm(journey.maxT).toFixed(1)} KM TRAVELLED`;
      }
      if (clockRef.current) {
        const startedAt = journey.startedAt;
        const elapsed = startedAt === null ? 0 : performance.now() - startedAt;
        const mm = String(Math.floor(elapsed / 60000)).padStart(2, '0');
        const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
        clockRef.current.textContent = `T+${mm}:${ss}`;
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    const unsubscribe = useSiteStore.subscribe((s) => s.scrollT, tick);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const linkStyle: React.CSSProperties = {
    color: '#44505A',
    transition: 'color 0.25s ease',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    // Height is CSS-resolved (.footer-section): FOOTER_HEIGHT_PX on desktop,
    // a 120svh seafloor shelf on mobile (A1).
    <div className="footer-section">
      {/* Seafloor ridge silhouette */}
      <svg
        aria-hidden="true"
        width="100%"
        height="90"
        viewBox="0 0 1200 90"
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, display: 'block' }}
      >
        <path
          d="M0,90 L0,58 Q80,42 160,55 T340,50 T520,62 T700,44 T880,58 T1060,48 L1200,56 L1200,90 Z"
          fill="rgba(0, 3, 5, 0.8)"
        />
      </svg>

      {/* Settled motes on the floor */}
      {MOTES.map((m, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: m.left,
            bottom: `${m.bottom}px`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            borderRadius: '50%',
            background: `rgba(101, 168, 158, ${m.o})`,
          }}
        />
      ))}

      {/* Vertical fade-in line */}
      <div style={{
        width: '1px',
        height: '44px',
        background: 'linear-gradient(to bottom, transparent, rgba(63, 168, 152, 0.35))',
      }} />

      {/* Mission recap — quiet live counters */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.2em',
          color: 'rgba(140, 165, 175, 0.5)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontVariantNumeric: 'tabular-nums',
          position: 'relative',
          padding: '0 16px',
        }}
      >
        <span ref={distanceRef}>0.0 KM TRAVELLED</span>
        <span aria-hidden="true">·</span>
        <span>{String(transmissions).padStart(2, '0')} TRANSMISSIONS RECEIVED</span>
        <span aria-hidden="true">·</span>
        <span ref={clockRef}>T+00:00</span>
      </p>

      {/* C6 — the recruiter path closes the mission: what he does, where he
          is, and the two channels — quiet, mono, on-fiction */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          position: 'relative',
          padding: '0 16px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.22em',
            color: 'rgba(140, 165, 175, 0.62)',
            textTransform: 'uppercase',
          }}
        >
          {site.proposition}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.18em',
            color: 'rgba(140, 165, 175, 0.42)',
          }}
        >
          {site.availability} · {site.location}
        </p>
        <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
          {[
            { href: site.resumeHref, label: 'EXTRACT FULL RECORD ↓', download: true },
            { href: `mailto:${site.email}`, label: 'OPEN CHANNEL →', download: false },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              download={link.download || undefined}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.18em',
                color: 'rgba(224, 178, 110, 0.75)',
                textDecoration: 'none',
                padding: '6px 2px', // ≥24px target with the line-height
                transition: 'color 0.25s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(238, 203, 148, 1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(224, 178, 110, 0.75)'; }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Social link row */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative' }}>
        <a
          href={site.socials.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          style={linkStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#7FC4B8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#44505A'; }}
        >
          {/* LinkedIn SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect x="2" y="9" width="4" height="12"/>
            <circle cx="4" cy="4" r="2"/>
          </svg>
        </a>
        <a
          href={site.socials.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          style={linkStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#7FC4B8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#44505A'; }}
        >
          {/* GitHub SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
        </a>
        {/* A9 — the contact channel docks here; on phones this row is the
            only email affordance (the fixed plate is hidden) */}
        <a
          href={`mailto:${site.email}`}
          aria-label="Email"
          style={linkStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#7FC4B8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#44505A'; }}
        >
          {/* Envelope SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="2.5" y="5" width="19" height="14" rx="2"/>
            <path d="M3 6.5l9 6.5 9-6.5"/>
          </svg>
        </a>
      </div>

      {/* End tag with the sonar ping behind it */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          aria-hidden="true"
          className="sonar-ring"
          style={{
            position: 'absolute',
            width: '190px',
            height: '190px',
            borderRadius: '50%',
            border: '1px solid rgba(63, 168, 152, 0.3)',
            pointerEvents: 'none',
          }}
        />
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.2em',
          color: '#3A464E',
          textTransform: 'uppercase',
          position: 'relative',
        }}>
          — end of transmission —
        </p>
      </div>
    </div>
  );
}
