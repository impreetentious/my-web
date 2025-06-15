import { SECTIONS } from '@/config/sections';
import type { ActiveSection } from '@/types';

export const activeSections: ActiveSection[] = SECTIONS
  .filter((section) => section.enabled)
  .map((section, index) => ({
    ...section,
    index,
  }));
