import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SiteStore, ZoneName } from '@/types';
import { ZONE_THRESHOLDS } from '@/config/world';

function deriveZone(t: number): ZoneName {
  if (t >= ZONE_THRESHOLDS.underwater) return 'underwater';
  if (t >= ZONE_THRESHOLDS.sea)        return 'sea';
  if (t >= ZONE_THRESHOLDS.horizon)    return 'horizon';
  return 'sky';
}

export const useSiteStore = create<SiteStore>()(
  subscribeWithSelector((set) => ({
    scrollT: 0,
    setScrollT: (t) =>
      set({ scrollT: t, activeZone: deriveZone(t) }),

    activeZone: 'sky',

    activePanelId: null,
    openPanel: (id) => set({ activePanelId: id }),
    closePanel: () => set({ activePanelId: null }),

    isLoading: true,
    setIsLoading: (value) => set({ isLoading: value }),

    quality: 'high',
    setQuality: (q) => set({ quality: q }),
  }))
);
