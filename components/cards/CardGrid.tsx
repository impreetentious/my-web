'use client';
import { activeSections } from '@/lib/activeSections';
import { getCardPositions } from '@/lib/cardPositioner';
import { useMobile } from '@/lib/useMobile';
import { Card } from '@/components/cards/Card';

export default function CardGrid() {
  const isMobile = useMobile();
  const positions = getCardPositions();

  if (isMobile) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        padding: '120px 24px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        pointerEvents: 'auto',
      }}>
        {activeSections.map((section) => (
          <Card key={section.id} section={section} position={null} isMobile={true} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {activeSections.map((section) => {
        const position = positions.find((p) => p.id === section.id);
        if (!position) return null;
        return (
          <div key={section.id} style={{ pointerEvents: 'auto' }}>
            <Card section={section} position={position} isMobile={false} />
          </div>
        );
      })}
    </div>
  );
}
