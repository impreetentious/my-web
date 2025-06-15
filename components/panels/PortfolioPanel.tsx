'use client';

import portfolioData from '@/content/portfolio.json';
import type { PortfolioItem } from '@/types';

const items = portfolioData as PortfolioItem[];

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

export function PortfolioPanel() {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
        }}
      >
        Portfolio
      </p>

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            borderTop: '1px solid var(--color-border-visible)',
            marginTop: '32px',
            paddingTop: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '16px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              {item.title}
            </h3>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {item.year}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', margin: '8px -4px -4px' }}>
            {item.tags.map((tag) => (
              <span key={tag} style={pillStyle}>
                {tag}
              </span>
            ))}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              marginTop: '8px',
            }}
          >
            {item.description}
          </p>

          {item.href && (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--color-accent)',
                textDecoration: 'none',
                marginTop: '12px',
              }}
            >
              View →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
