'use client';

import aboutData from '@/content/about.json';

const pillStyle: React.CSSProperties = {
  display: 'inline-block',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '4px 12px',
  borderRadius: '2px',
  fontSize: '12px',
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-text-secondary)',
  margin: '4px',
};

const subheadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
  marginTop: '40px',
  marginBottom: '16px',
};

export function AboutPanel() {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
        }}
      >
        About Me
      </p>

      <h2
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '32px',
          fontWeight: 300,
          color: 'var(--color-text-primary)',
          marginTop: '16px',
        }}
      >
        {aboutData.name}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          marginTop: '8px',
        }}
      >
        {aboutData.headline}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          marginTop: '4px',
        }}
      >
        {aboutData.tagline}
      </p>

      {/* Impact stat grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginTop: '32px',
        }}
      >
        {aboutData.stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '4px',
              padding: '16px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '26px',
                fontWeight: 300,
                color: 'var(--color-accent)',
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginTop: '6px',
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Bio */}
      <div style={{ marginTop: '40px' }}>
        {aboutData.bio.map((paragraph) => (
          <p
            key={paragraph.slice(0, 32)}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8,
              marginBottom: '16px',
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Current focus */}
      <p style={subheadingStyle}>Currently</p>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '15px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.8,
        }}
      >
        {aboutData.currentFocus}
      </p>

      {/* Skills */}
      <p style={subheadingStyle}>Skills</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-4px' }}>
        {aboutData.skills.map((skill) => (
          <span key={skill} style={pillStyle}>
            {skill}
          </span>
        ))}
      </div>

      {/* Stack */}
      <p style={subheadingStyle}>Stack</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-4px' }}>
        {aboutData.stack.map((tool) => (
          <span key={tool} style={pillStyle}>
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}
