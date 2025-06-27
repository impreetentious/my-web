'use client';

import portfolioData from '@/content/portfolio.json';
import { DossierBlock, DossierRow, DossierFigure, CaseFile } from '@/components/panels/dossier';
import type { PortfolioItem } from '@/types';

// E3 — enabled: false hides a row without deleting its record; the counter
// below counts the filtered list.
const items = (portfolioData as PortfolioItem[]).filter((i) => i.enabled !== false);

export function PortfolioPanel() {
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
          {String(items.length).padStart(2, '0')} RECORDS · STRATEGY / GTM / PRODUCT
        </p>
      </DossierBlock>

      {items.map((item, i) => (
        <DossierRow
          key={item.id}
          href={item.href}
          meta={item.year}
          title={item.title}
          description={item.description}
          chips={item.tags}
          figure={
            item.figure && (
              <DossierFigure
                kind={item.figure}
                seed={item.id}
                serial={`FIG.${String(i + 1).padStart(2, '0')} · ${item.id.slice(0, 6).toUpperCase()}`}
              />
            )
          }
        >
          {item.caseStudy && <CaseFile index={i} id={item.id} study={item.caseStudy} />}
        </DossierRow>
      ))}
    </div>
  );
}
