import type { SectionConfig } from '@/types';

export const SECTIONS: SectionConfig[] = [
  {
    id: 'about',
    enabled: true,
    label: 'About Me',
    type: 'panel',
    side: 'left',
    tagline: 'Background, skills, and what I am working on.',
  },
  {
    id: 'portfolio',
    enabled: true,
    label: 'Portfolio',
    type: 'panel',
    side: 'right',
    tagline: 'Selected work across strategy, GTM, and product.',
  },
  {
    id: 'blog',
    enabled: true,
    label: 'Blog',
    type: 'route',
    side: 'left',
    href: '/blog',
    tagline: 'Writing on strategy, systems, and everything else.',
  },
  {
    id: 'projects',
    enabled: true,
    label: 'Projects',
    type: 'panel',
    side: 'right',
    tagline: 'Things built, shipped, and iterated on.',
  },
  {
    id: 'placeholder',
    enabled: false,        // ← change to true when ready to activate
    label: 'TBD',
    type: 'panel',
    side: 'left',
    tagline: 'Coming soon.',
  },
];
