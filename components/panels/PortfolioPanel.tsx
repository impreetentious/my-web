'use client';

import portfolioData from '@/content/portfolio.json';
import { DossierBlock, DossierRow } from '@/components/panels/dossier';
import type { PortfolioItem } from '@/types';

const items = portfolioData as PortfolioItem[];

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

      {items.map((item) => (
        <DossierRow
          key={item.id}
          href={item.href}
          meta={item.year}
          title={item.title}
          description={item.description}
          chips={item.tags}
        />
      ))}
    </div>
  );
}
