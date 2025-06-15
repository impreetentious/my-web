import { activeSections } from '@/lib/activeSections';
import {
  SECTION_HEIGHT_PX,
  HEADER_HEIGHT_PX,
  CARD_OFFSET_PX,
  SPINE_CONTROL_DISTANCE_PX,
} from '@/config/world';
import type { SpineAnchor } from '@/types';

export function generateSpinePath(
  viewportWidth: number,
  totalHeight: number
): { d: string; anchors: SpineAnchor[] } {
  const center = viewportWidth / 2;
  const ctrl = SPINE_CONTROL_DISTANCE_PX;

  const anchors: SpineAnchor[] = activeSections.map((section) => ({
    id: section.id,
    side: section.side,
    x: center + (section.side === 'right' ? CARD_OFFSET_PX : -CARD_OFFSET_PX),
    y: HEADER_HEIGHT_PX + section.index * SECTION_HEIGHT_PX + SECTION_HEIGHT_PX / 2,
  }));

  // Build the SVG path d string
  const parts: string[] = [`M ${center} 0`];

  // First curve: from start point (center, 0) to first anchor
  if (anchors.length > 0) {
    const a0 = anchors[0];
    parts.push(`C ${center} ${ctrl}, ${a0.x} ${a0.y - ctrl}, ${a0.x} ${a0.y}`);
  }

  // Middle curves: between consecutive anchors
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    parts.push(
      `C ${a.x} ${a.y + ctrl}, ${b.x} ${b.y - ctrl}, ${b.x} ${b.y}`
    );
  }

  // Last curve: from final anchor to end point (center, totalHeight)
  if (anchors.length > 0) {
    const last = anchors[anchors.length - 1];
    parts.push(
      `C ${last.x} ${last.y + ctrl}, ${center} ${totalHeight - ctrl}, ${center} ${totalHeight}`
    );
  } else {
    // No active sections — straight vertical line
    parts.push(`L ${center} ${totalHeight}`);
  }

  return { d: parts.join(' '), anchors };
}
