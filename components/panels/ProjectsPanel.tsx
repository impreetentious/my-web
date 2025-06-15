'use client';

import projectsData from '@/content/projects.json';
import type { ProjectItem } from '@/types';

const items = projectsData as ProjectItem[];

const STATUS_COLORS: Record<ProjectItem['status'], string> = {
  live: '#22c55e',
  wip: '#f59e0b',
  archived: 'var(--color-text-muted)',
};

const STATUS_LABELS: Record<ProjectItem['status'], string> = {
  live: 'Live',
  wip: 'WIP',
  archived: 'Archived',
};

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

export function ProjectsPanel() {
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
        Projects
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: STATUS_COLORS[item.status],
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: STATUS_COLORS[item.status],
                }}
              />
              {STATUS_LABELS[item.status]}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', margin: '8px -4px -4px' }}>
            {item.stack.map((tech) => (
              <span key={tech} style={pillStyle}>
                {tech}
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
              {item.href.includes('github.com') ? 'View on GitHub →' : 'View live →'}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
