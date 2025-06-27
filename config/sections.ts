import type { SectionConfig } from '@/types';

// `side` is omitted everywhere on purpose (E5): lib/activeSections derives it
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
    id: 'placeholder',
    enabled: false,        // ← change to true when ready to activate
    label: 'TBD',
    type: 'panel',
    tagline: 'Coming soon.',
  },
];
