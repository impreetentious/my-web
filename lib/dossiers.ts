import { activeSections } from '@/lib/activeSections';
import type { ActiveSection } from '@/types';

// Only enabled panel sections are shareable dossiers. Route sections belong to
// their own pages and disabled panels must not acquire accidental public URLs.
export const addressableDossiers: ActiveSection[] = activeSections.filter(
  (section) => section.type === 'panel',
);

export function getAddressableDossier(id: string): ActiveSection | undefined {
  return addressableDossiers.find((section) => section.id === id);
}

export function isAddressableDossierId(id: string | null | undefined): id is string {
  return typeof id === 'string' && Boolean(getAddressableDossier(id));
}
