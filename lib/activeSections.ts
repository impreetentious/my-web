import { SECTIONS } from '@/config/sections';
import {
  SECTION_HEIGHT_PX,
  HEADER_HEIGHT_PX,
  FOOTER_HEIGHT_PX,
} from '@/config/world';
import type { ActiveSection } from '@/types';

export const activeSections: ActiveSection[] = SECTIONS
  .filter((section) => section.enabled)
  .map((section, index) => ({
    ...section,
    index,
  }));

// One place for the world's height — the scroll container, spine geometry and
// the shader's screen→page mapping must all agree on it.
export const totalPageHeight =
  HEADER_HEIGHT_PX + activeSections.length * SECTION_HEIGHT_PX + FOOTER_HEIGHT_PX;
