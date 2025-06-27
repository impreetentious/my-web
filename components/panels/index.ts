import { AboutPanel }       from './AboutPanel';
import { PortfolioPanel }   from './PortfolioPanel';
import { ProjectsPanel }    from './ProjectsPanel';
import { ContactPanel }     from './ContactPanel';
import { PlaceholderPanel } from './PlaceholderPanel';
import type { ComponentType } from 'react';

export const PANEL_REGISTRY: Record<string, ComponentType> = {
  about:       AboutPanel,
  portfolio:   PortfolioPanel,
  projects:    ProjectsPanel,
  contact:     ContactPanel,
  placeholder: PlaceholderPanel,
  // Blog is type 'route' — it never opens a panel, so it is not registered here.
};
