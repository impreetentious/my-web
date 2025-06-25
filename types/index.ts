// ─── Section Types ─────────────────────────────────────────────────────────

export type SectionType = 'panel' | 'route';
export type SectionSide = 'left' | 'right';
export type ZoneName = 'sky' | 'horizon' | 'sea' | 'underwater';
export type QualityLevel = 'high' | 'medium' | 'low';

export interface SectionConfig {
  id: string;          // internal key, never changes
  enabled: boolean;    // THE toggle — false means section does not exist anywhere
  label: string;       // display name shown on card and in panel header
  type: SectionType;   // 'panel' = opens overlay, 'route' = navigates to href
  side: SectionSide;   // which side of the spine the card sits on
  href?: string;       // only required when type === 'route'
  tagline: string;     // one sentence shown on the card below the label
}

export interface ActiveSection extends SectionConfig {
  index: number;       // position in the enabled-only list (0-based)
}

// ─── Layout Types ──────────────────────────────────────────────────────────

export interface SpineAnchor {
  id: string;          // matches section id
  x: number;           // pixel x in SVG coordinate space
  y: number;           // pixel y in SVG coordinate space (vertical center of section)
  side: SectionSide;
}

// ─── Store Types ───────────────────────────────────────────────────────────

export interface SiteStore {
  scrollT: number;                    // 0 to 1, normalised scroll position
  setScrollT: (t: number) => void;

  activeZone: ZoneName;               // derived from scrollT automatically

  activePanelId: string | null;       // id of currently open panel, null if none
  openPanel: (id: string) => void;
  closePanel: () => void;
  openedPanelIds: string[];           // dossiers decoded this visit (recap counter)

  isLoading: boolean;
  setIsLoading: (value: boolean) => void;

  quality: QualityLevel;              // render tier (B3): high = full shader,
                                      // medium = dpr-1 lite shader (mobile
                                      // default), low = animated CSS world.
                                      // Set by lib/quality.ts on mount;
                                      // demoted by fps probe / context loss.
  setQuality: (q: QualityLevel) => void;
}

// ─── Content Types ─────────────────────────────────────────────────────────

export interface BlogPost {
  slug: string;
  title: string;
  date: string;        // ISO date string, e.g. "2025-05-11"
  excerpt: string;
  content?: string;    // full MDX content, only present on individual post pages
  readingTime: number; // minutes, computed from the source (C8)
  entry: number;       // 1-based chronological log number (oldest = 1)
  series?: string;     // series id from frontmatter — see SERIES in lib/blog.ts
  seriesIndex?: number; // 1-based part number within the series
}

// C4 — every dossier row carries an artifact: an abstract schematic drawn
// deterministically from the row's id, in one of these archetypes.
export type FigureKind = 'network' | 'bars' | 'stack' | 'flow' | 'orbit' | 'pulse';

// C5 — an anonymised case study rendered as a declassified extract inside
// the dossier row. All narrative fields are owner-approved content.
export interface CaseStudy {
  context: string;
  decision: string;
  move: string;    // the analytical move
  model: string;   // the operating model
  outcome: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  href?: string | null; // link to live project or case study; null (not just
                         // omitted) means "no link" — content/portfolio.json (C.7)
                         // sets this explicitly on every item, matching the
                         // pattern used across all content JSON in this plan
  year: string;
  figure?: FigureKind;
  caseStudy?: CaseStudy | null;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  stack: string[];     // technology tags
  href?: string | null; // GitHub or live link; null means "no link" — see
                         // PortfolioItem.href above, same reasoning
  status: 'live' | 'wip' | 'archived';
  figure?: FigureKind;
}
