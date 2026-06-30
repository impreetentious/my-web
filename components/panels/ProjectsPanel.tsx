'use client';

import projectsData from '@/content/projects.json';
import { DossierBlock, DossierRow, DossierFigure } from '@/components/panels/dossier';
import type { ProjectItem } from '@/types';

// enabled: false hides a row without deleting its record; the counter
// below counts the filtered list.
const items = (projectsData as ProjectItem[]).filter((i) => i.enabled !== false);

const STATUS_COLORS: Record<ProjectItem['status'], string> = {
  live: 'rgba(96, 200, 140, 0.9)',
  private: 'var(--color-text-muted)',
  wip: 'rgba(224, 178, 110, 0.9)',
  archived: 'var(--color-text-muted)',
};

const STATUS_LABELS: Record<ProjectItem['status'], string> = {
  live: 'LIVE',
  private: 'PRIVATE',
  wip: 'WIP',
  archived: 'ARCHIVED',
};

export function ProjectsPanel() {
  return (
    <div>
      <DossierBlock>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.16em',
            color: 'var(--color-text-muted)',
            marginBottom: '28px',
          }}
        >
          {String(items.length).padStart(2, '0')} RECORDS · BUILT AND SHIPPED
        </p>
      </DossierBlock>

      {items.map((item, i) => (
        <DossierRow
          key={item.id}
          href={item.href}
          figure={
            item.figure && (
              <DossierFigure
                kind={item.figure}
                seed={item.id}
                serial={`FIG.${String(i + 1).padStart(2, '0')} · ${item.id.slice(0, 6).toUpperCase()}`}
              />
            )
          }
          meta={
            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  color: STATUS_COLORS[item.status],
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: STATUS_COLORS[item.status],
                    boxShadow: item.status === 'live' ? '0 0 6px rgba(96, 200, 140, 0.7)' : 'none',
                  }}
                />
                {STATUS_LABELS[item.status]}
              </span>
            </span>
          }
          title={item.title}
          description={item.description}
          chips={item.stack}
          arrowLabel={item.href?.includes('github.com') ? '↗ SOURCE' : '↗ LIVE'}
        />
      ))}
    </div>
  );
}
