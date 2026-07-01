import type { SectionConfig } from '@/types';

// `scripts/verify-placeholder-states.mjs` builds the site in both toggle
// states. It flips this env var rather than rewriting the file, so an
// interrupted run can never leave tracked source dirty. Unset (the normal case)
// means the literal below wins.
const PLACEHOLDER_ENABLED =
  process.env.MW_FORCE_PLACEHOLDER === undefined
    ? undefined
    : process.env.MW_FORCE_PLACEHOLDER === 'true';

// `side` is omitted everywhere on purpose: lib/activeSections derives it
// by alternating over the ENABLED list, so any toggle state stays correct.
// Set `side` on an entry only to pin it.
export const SECTIONS: SectionConfig[] = [
  {
    id: 'about',
    enabled: true,
    label: 'About Me',
    type: 'panel',
    tagline: 'Background, skills, and what I am working on.',
  },
  {
    id: 'portfolio',
    enabled: true,
    label: 'Portfolio',
    type: 'panel',
    tagline: 'Selected work across strategy, GTM, and product.',
  },
  {
    id: 'blog',
    enabled: true,
    label: 'Blog',
    type: 'route',
    href: '/blog',
    tagline: 'Writing on strategy, systems, and everything else.',
  },
  {
    id: 'projects',
    enabled: true,
    label: 'Projects',
    type: 'panel',
    tagline: 'Things built, shipped, and iterated on.',
  },
  {
    // the dormant sixth stage. Stays ABOVE contact so contact is always
    // the deepest transmission; flipping this boolean must produce a correct
    // world in BOTH states (the world tuning derives from the enabled count).
    id: 'placeholder',
    enabled: PLACEHOLDER_ENABLED ?? false, // ← change the literal to activate
    label: 'TBD',
    type: 'panel',
    tagline: 'Transmission pending.',
  },
  {
    // Contact ("OPEN CHANNEL"): the deepest transmission, links only.
    id: 'contact',
    enabled: true,
    label: 'Contact',
    type: 'panel',
    tagline: 'Establish an uplink. All channels monitored.',
  },
];
