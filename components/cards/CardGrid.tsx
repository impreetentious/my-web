'use client';

import {
  activeSections,
  sectionCenterFractionDesktop,
  sectionCenterFractionMobile,
} from '@/lib/activeSections';
import { Card } from '@/components/cards/Card';

// One DOM for both breakpoints: every card lives in an absolutely
// positioned slot whose geometry is resolved in CSS (.card-slot) from the
// custom properties below — beside the spine on desktop, indented off the
// gutter wake on mobile. Server HTML, phone paint and desktop paint all
// agree, so there is nothing left to shift (CLS ≈ 0). Slot ids double as
// skip-link/anchor targets.
export default function CardGrid() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {activeSections.map((section) => (
        <div
          key={section.id}
          id={`card-${section.id}`}
          className="card-slot"
          data-side={section.side}
          style={
            {
              '--slot-top': `${(sectionCenterFractionDesktop(section.index) * 100).toFixed(4)}%`,
              '--slot-top-m': `${(sectionCenterFractionMobile(section.index) * 100).toFixed(4)}%`,
            } as React.CSSProperties
          }
        >
          <Card section={section} />
        </div>
      ))}
    </div>
  );
}
