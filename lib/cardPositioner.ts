import { activeSections } from '@/lib/activeSections';
import { SECTION_HEIGHT_PX, HEADER_HEIGHT_PX } from '@/config/world';
import type { CardPosition } from '@/types';

export function getCardPositions(): CardPosition[] {
  return activeSections.map((section) => ({
    id: section.id,
    side: section.side,
    // Card is centred vertically within its section slot
    yCenter:
      HEADER_HEIGHT_PX +
      section.index * SECTION_HEIGHT_PX +
      SECTION_HEIGHT_PX / 2,
  }));
}
