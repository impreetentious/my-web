'use client';

import site from '@/content/site.json';
import {
  DossierBlock,
  DossierHead,
  DossierRow,
  ChannelLink,
} from '@/components/panels/dossier';

// F1 — Contact is the deepest transmission: "OPEN CHANNEL". It reuses the
// dossier kit wholesale (no new visual language) and owns the recruiter path
// the footer used to carry. Every fact comes from site.json (Rule B); the
// fiction chrome (the footnote) is a code string (Rule A).

/** Display host of a social URL — DERIVED from site.json so the domain chip
 *  is never a second source for the link (Rule B: no hardcoded host literal). */
function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ContactPanel() {
  return (
    <div>
      {/* Lede — the proposition in the sans voice, mirroring the About lede */}
      <DossierBlock>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '19px',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
            lineHeight: 1.5,
          }}
        >
          {site.proposition}
        </p>
      </DossierBlock>

      {/* Status — availability + location, mono */}
      <DossierHead>Status</DossierHead>
      <DossierBlock>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.14em',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
          }}
        >
          {site.availability} · {site.location}
        </p>
      </DossierBlock>

      {/* Channels — the two primary CTAs */}
      <DossierHead>Channels</DossierHead>
      <DossierBlock>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <ChannelLink href={`mailto:${site.email}`}>OPEN CHANNEL</ChannelLink>
          <ChannelLink href={site.resumeHref} download>
            EXTRACT FULL RECORD
          </ChannelLink>
        </div>
      </DossierBlock>

      {/* Relay stations — socials as dossier rows (target=_blank + arrow are
          built into DossierRow's link) */}
      <DossierHead>Relay stations</DossierHead>
      <DossierRow
        href={site.socials.linkedin}
        meta="STATION 01"
        title="LinkedIn"
        description="Career record, network, and professional signal."
        chips={[host(site.socials.linkedin)]}
        arrowLabel="↗ OPEN"
      />
      <DossierRow
        href={site.socials.github}
        meta="STATION 02"
        title="GitHub"
        description="Source relay — code, builds, and experiments."
        chips={[host(site.socials.github)]}
        arrowLabel="↗ OPEN"
      />

      {/* Fiction footnote — chrome, so it lives as a code string (Rule A) */}
      <DossierBlock style={{ marginTop: '44px' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: 'var(--color-text-muted)',
          }}
        >
          {'RESPONSE LATENCY: < 24H · ALL FREQUENCIES MONITORED'}
        </p>
      </DossierBlock>
    </div>
  );
}
