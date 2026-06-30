import { SECTIONS } from '@/config/sections';
import {
  SECTION_HEIGHT_PX,
  HEADER_HEIGHT_PX,
  FOOTER_HEIGHT_PX,
  MOBILE_HERO_SVH,
  MOBILE_SECTION_SVH,
  MOBILE_FOOTER_SVH,
} from '@/config/world';
import type { ActiveSection } from '@/types';

// `side` alternates on the FILTERED list (left first), so toggling any
// section can never strand two adjacent cards on the same side. A config
// entry may still pin a side explicitly; omitted means auto.
export const activeSections: ActiveSection[] = SECTIONS.filter((section) => section.enabled).map(
  (section, index) => ({
    ...section,
    index,
    side: section.side ?? (index % 2 === 0 ? 'left' : 'right'),
  }),
);

// One place for the world's height — the scroll container, spine geometry and
// the shader's screen→page mapping must all agree on it.
export const totalPageHeight =
  HEADER_HEIGHT_PX + activeSections.length * SECTION_HEIGHT_PX + FOOTER_HEIGHT_PX;

/** Mobile world height in svh units — hero + section slots + seafloor. */
export const mobileWorldSvh =
  MOBILE_HERO_SVH + activeSections.length * MOBILE_SECTION_SVH + MOBILE_FOOTER_SVH;

/** Vertical centre of a section slot as a fraction of the desktop world
 *  height. Card slots and spine anchors both derive from this, so they can
 *  never drift apart. */
export function sectionCenterFractionDesktop(index: number): number {
  return (HEADER_HEIGHT_PX + index * SECTION_HEIGHT_PX + SECTION_HEIGHT_PX / 2) / totalPageHeight;
}

/** Same, against the mobile world. */
export function sectionCenterFractionMobile(index: number): number {
  return (MOBILE_HERO_SVH + index * MOBILE_SECTION_SVH + MOBILE_SECTION_SVH / 2) / mobileWorldSvh;
}
