'use client';

import aboutData from '@/content/about.json';
import { DossierBlock, DossierHead, Chip, ChipRow } from '@/components/panels/dossier';

export function AboutPanel() {
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
          {aboutData.name} — {aboutData.headline}
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

      {/* Impact readout */}
      <DossierHead>Field readings</DossierHead>
      <DossierBlock
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '2px',
        }}
      >
        {aboutData.stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              padding: '18px 16px 16px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '28px',
                fontWeight: 300,
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
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginTop: '8px',
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </DossierBlock>

      {/* Bio */}
      <DossierHead>Transcript</DossierHead>
      {aboutData.bio.map((paragraph) => (
        <DossierBlock key={paragraph.slice(0, 32)}>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8,
              marginBottom: '16px',
              maxWidth: '560px',
            }}
          >
            {paragraph}
          </p>
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
    </div>
  );
}
