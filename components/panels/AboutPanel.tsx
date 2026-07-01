'use client';

import aboutData from '@/content/about.json';
import site from '@/content/site.json';
import {
  DossierBlock,
  DossierHead,
  Chip,
  ChipRow,
  PullQuote,
  ChannelLink,
} from '@/components/panels/dossier';
import { trackConversion } from '@/lib/analytics';

// About is an actual dossier now: a display-serif pull-quote carries the
// strongest field record, the transcript gets margin annotations, and the
// channels block closes the file with the recruiter path — proposition,
// availability, full record, open channel. Dossier copy lives in about.json;
// identity facts (name, email, channels) come from site.json.
// ChannelLink is the shared CTA — extracted to dossier.tsx so ContactPanel
// speaks the same language.

export function AboutPanel() {
  const hasResume = site.resumeAvailable && Boolean(site.resumeHref);

  return (
    <div>
      {/* Lede */}
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
          {site.name} — {aboutData.headline}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            marginTop: '10px',
          }}
        >
          {aboutData.tagline}
        </p>
      </DossierBlock>

      {/* The strongest field record speaks the document voice */}
      <PullQuote quote={aboutData.pullQuote} refLine={aboutData.pullQuoteRef} />

      {/* Impact readout */}
      <DossierHead>Field readings</DossierHead>
      <DossierBlock
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '2px',
        }}
      >
        {aboutData.stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              padding: '18px 14px 16px',
              minWidth: 0, // grid items must be allowed to shrink — labels wrap instead of clipping
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display), Georgia, serif',
                fontSize: '30px',
                fontWeight: 400,
                color: 'var(--color-text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginTop: '8px',
                overflowWrap: 'break-word',
                lineHeight: 1.6,
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </DossierBlock>

      {/* Bio — the transcript, with margin annotations */}
      <DossierHead>Transcript</DossierHead>
      {aboutData.bio.map((paragraph, i) => (
        <DossierBlock key={paragraph.slice(0, 32)}>
          <div className="dossier-annot-row" style={{ marginBottom: '16px' }}>
            <p className="dossier-annot">{aboutData.bioNotes?.[i] ?? ''}</p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '15px',
                fontWeight: 400,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.8,
                maxWidth: '560px',
              }}
            >
              {paragraph}
            </p>
          </div>
        </DossierBlock>
      ))}

      {/* Current focus */}
      <DossierHead>Current heading</DossierHead>
      <DossierBlock>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.8,
            maxWidth: '560px',
          }}
        >
          {aboutData.currentFocus}
        </p>
      </DossierBlock>

      {/* Skills */}
      <DossierHead>Instruments</DossierHead>
      <DossierBlock>
        <ChipRow>
          {aboutData.skills.map((skill) => (
            <Chip key={skill}>{skill}</Chip>
          ))}
        </ChipRow>
      </DossierBlock>

      {/* Stack */}
      <DossierHead>Onboard systems</DossierHead>
      <DossierBlock>
        <ChipRow>
          {aboutData.stack.map((tool) => (
            <Chip key={tool}>{tool}</Chip>
          ))}
        </ChipRow>
      </DossierBlock>

      {/* Channels — the recruiter path, on-fiction */}
      <DossierHead>Channels</DossierHead>
      <DossierBlock>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            color: 'var(--color-text-primary)',
            lineHeight: 1.7,
            maxWidth: '540px',
          }}
        >
          {site.proposition}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.18em',
            color: 'var(--color-text-muted)',
            marginTop: '10px',
          }}
        >
          {site.availability} · {site.location}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '22px' }}>
          {hasResume && (
            <ChannelLink
              href={site.resumeHref}
              download
              onSelect={() => trackConversion('resume_download', { surface: 'about_panel' })}
            >
              EXTRACT FULL RECORD
            </ChannelLink>
          )}
          <ChannelLink
            href={`mailto:${site.email}`}
            onSelect={() => trackConversion('contact_email', { surface: 'about_panel' })}
          >
            OPEN CHANNEL
          </ChannelLink>
        </div>
      </DossierBlock>
    </div>
  );
}
