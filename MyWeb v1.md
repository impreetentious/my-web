# Personal Website — Master Build Plan
### "The Spiral Descent" · Every file, every decision, every dependency

---

## How to Read This Plan

This document specifies every single file in the build. Each file entry tells you exactly
what it does, what it imports, what it exports, what it must never touch, and what logic
goes inside it. You can hand any single entry to an AI agent and get a correct file back.

**Two types of tasks exist throughout:**

SERIAL means every agent waits. Nothing proceeds until these files are done.
PARALLEL means multiple agents can work simultaneously — their work does not touch each other.

**A note on file codes:** Codes are scoped to their phase or track, so similar-looking
codes mean different things. "F0.1" through "F0.10" are Phase 0 Foundation files.
"F.1" through "F.7" are Track F (Blog Route) files. They are unrelated — match the
code to its section heading, not just the letter.

**The golden rule of isolation:** Every component, panel, and system reads from the shared
config and store. They do not import from each other's directories. If a component needs
something from another component, it goes through the store.

---

## What to Do If You Are Starting From Scratch With an AI Agent

Hand each section to a separate AI agent. The agent needs:
1. The relevant file entry from this document
2. The content of types/index.ts (so it knows the types it uses)
3. The content of any config file it imports from
4. The isolation rule for its file from the table above

Tell the agent: "Write only the file specified. Do not create other files. Follow the
imports and exports listed exactly. Do not add dependencies beyond what is listed."

When all files exist, run `npm run dev`. TypeScript errors are almost always a type
mismatch between exports and their callsites — the fix is always in types/index.ts
or in bringing the usage in line with what is exported.

---

## Design Decisions Reference
### (Everything agreed — do not revisit)

Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS v3.4, Three.js + React Three Fiber,
Lenis (smooth scroll), GSAP (tween only, easeOut family only — never spring physics), Zustand.

Version pins (deliberate — do not "upgrade" during setup): create-next-app@15 (the @latest
tag now scaffolds Next 15) and tailwindcss@3.4 (the current default is Tailwind v4, whose
CSS-first config and `@import "tailwindcss"` syntax are incompatible with this plan's
tailwind.config.ts and `@tailwind` directives). The scaffold therefore runs with
--no-tailwind and Tailwind v3 is wired up manually in Steps 2 and 5.

Colors: Cyan #00FFEE (accent), #080808 (background), #111111 (surface), #1A1A1A (elevated
surface), #F2F2F2 (text primary), #888888 (text secondary), #444444 (text muted),
rgba(255,255,255,0.08) (border subtle), rgba(0,255,238,0.2) (card border default),
rgba(0,255,238,0.7) (card border hover/active).

Spine: Full-page SVG, position absolute, scrolls with page. Three animation layers:
dim static base path, traveling cyan pulse (CSS keyframes), scroll-progress fill.
Smooth cubic bezier curves. Alternates left and right through section anchors.
Anchor nodes: small circles rendered at each section anchor point on the spine.

Sections: About Me (left), Portfolio (right), Blog (left, routes to /blog), Projects (right),
Placeholder (left, starts disabled). Each section is a card that opens a full-screen panel,
except Blog which navigates to /blog.

Panels: Full-screen overlay, GSAP open/close (power2.out, 0.45s), backdrop blur, near-black.
Click outside or press X to close.

Hero Area: Full first-viewport landing zone (800px) with name, role, and scroll prompt.
Animated in via GSAP after loading screen exits.

Loading: Terminal-style boot sequence showing 4 system-check lines before the site appears.

Contact: A fixed email icon (mailto: link), bottom-right. Social links in footer zone.

Footer: Subtle closing section at bottom of scroll — social links and end-of-transmission tag.

Hosting: Vercel. GitHub CI/CD. Analytics via @vercel/analytics (free, privacy-first).

Animation rule: GSAP tween only. Ease family: power1, power2, power3 with .out or .inOut
variants. Never spring, never elastic, never bounce. All animations respect prefers-reduced-motion.

Mobile: Cards stack vertically below 768px. Spine, NavDots, DepthIndicator, and WebGL
hidden on mobile. Full experience on desktop.

---

## Project Setup
### Do this once before any other work. Not parallelisable.

**Step 1 — Create the project**

The project lives in the existing repo folder `personal-website` — scaffold in place
with `.`, not into a new subfolder. create-next-app refuses to run in a directory
containing files it does not recognise, so move this plan document out first and bring
it back after.

```
cd .  # repository root (historically also called personal-website)
mv "MyWeb v1.md" /tmp/
npx create-next-app@15 . --typescript --eslint --app --no-tailwind --no-src-dir --import-alias "@/*" --turbopack
mv "/tmp/MyWeb v1.md" .
```

Note the pins: `@15` (not @latest, which scaffolds Next 15) and `--no-tailwind` (the
scaffold would otherwise install Tailwind v4 — this plan uses v3, installed in Step 2).

**Step 2 — Install all dependencies**

From the project root, run:

```
npm install three @react-three/fiber
npm install lenis gsap zustand
npm install gray-matter next-mdx-remote@5
npm install lucide-react
npm install @vercel/analytics
npm install -D @types/three tailwindcss@3.4 postcss autoprefixer
```

Deliberately absent: `zod`, `@react-three/drei`, and `@react-three/postprocessing` — no
file in this plan references any of them. Add drei/postprocessing only if the v0.2
atmosphere work turns out to need them.

**Step 3 — Create folder structure**

Create these empty folders inside the project root. The folders must exist before any
agents start writing files into them.

```
mkdir -p types
mkdir -p config
mkdir -p lib
mkdir -p store
mkdir -p styles
mkdir -p content/blog
mkdir -p components/spine
mkdir -p components/cards
mkdir -p components/panels
mkdir -p components/canvas
mkdir -p components/ui
mkdir -p components/blog
mkdir -p components/providers
```

**Step 4 — Update next.config.ts**

Replace the entire contents of next.config.ts with this:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
```

Why the trimmed config: blog MDX never goes through the Next build pipeline
(next-mdx-remote compiles it at request/build time), so no `pageExtensions: ['mdx']`,
no `@next/mdx`, and no `experimental.mdxRs` are needed.

**Step 5 — Create tailwind.config.ts and postcss.config.mjs**

The scaffold ran with --no-tailwind, so both files are created from scratch.
Create tailwind.config.ts at the project root with this content:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#00FFEE',
        bg: '#080808',
        surface: '#111111',
        elevated: '#1A1A1A',
        'text-primary': '#F2F2F2',
        'text-secondary': '#888888',
        'text-muted': '#444444',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

Then create postcss.config.mjs at the project root with this:

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

**Scaffold leftovers:** create-next-app leaves its own app/globals.css, app/layout.tsx,
and app/page.tsx. Leave all three alone until Phase 3 — I.2 fully replaces layout.tsx
(delete app/globals.css at that moment; styles/globals.css takes over via the I.2
import), and I.3 fully replaces page.tsx.

---

## Technical Risk Register
### Known failure points across the stack, and how each one is avoided.

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R01 | GSAP used outside 'use client' boundary | High | Build crash | Every component using GSAP must have 'use client' at top |
| R02 | Three.js / R3F SSR error | High | White page | ExperienceCanvas MUST use `dynamic(..., { ssr: false })` |
| R03 | Lenis initialised before DOM ready | Medium | Scroll broken | Init inside `useEffect`, not at module level |
| R04 | next-mdx-remote version API change | Medium | Blog crash | Pin to `next-mdx-remote@5` explicitly at install time |
| R05 | SVG path length = 0 on first render | Medium | Invisible progress | Guard: `if (totalPathLength === 0) return` before dasharray |
| R06 | Tailwind purging CSS classes built in strings | Medium | Missing styles | Do not build class names with string interpolation; use full class names |
| R07 | Google Fonts timeout on poor connection | Low | FOUT / FOIT | next/font handles this natively — no action needed |
| R08 | WebGL crash on low-end Android | Medium | White canvas | ExperienceCanvas is disabled entirely on mobile via useMobile |
| R09 | IntersectionObserver not available (old browser) | Low | Cards stay invisible | Add polyfill or guard: `if (!('IntersectionObserver' in window)) return` |
| R10 | Zustand subscribe selector stale | Low | Missed updates | Use two-arg form: `subscribe(state => state.scrollT, callback)` — this requires the store to be wrapped in `subscribeWithSelector` (see F0.6); without it, the callback never fires |
| R11 | Blog post with no `slug` field in frontmatter | Medium | Wrong URL | Default: `filename.replace('.mdx', '')` — already handled in lib/blog.ts |
| R12 | CORS error if fonts load cross-origin | Low | Font flash | next/font self-hosts fonts; no external font request at runtime |
| R13 | HeroSection animations fire before loading screen exits | Medium | Visual clash | HeroSection subscribes to `isLoading` in the store before starting its GSAP timeline |
| R14 | Mobile keyboard pushes viewport up over fixed UI | Low | NavDots/icons jump | Use `env(safe-area-inset-*)` on fixed elements if this is observed |
| R15 | create-next-app@latest scaffolds Next 15 + Tailwind v4, both incompatible with this plan | High | Broken setup | Pin `create-next-app@15`, scaffold with `--no-tailwind`, install `tailwindcss@3.4` manually (see Project Setup) |
| R16 | Lenis swallows wheel events over the open panel — the page behind scrolls instead of the panel content | High | Broken panel UX | `data-lenis-prevent` on the panel scroll area + `stopScroll()`/`startScroll()` on open/close (C.0) |
| R17 | Panel content unmounts the instant activePanelId goes null — blank panel during the 0.3s close fade | Medium | Visual glitch | PanelOverlay keeps `renderedPanelId` until the close tween's onComplete (C.0) |
| R18 | Literal font names ("Space Mono") in inline styles miss next/font's hashed family names | Medium | Silent fallback fonts | Always use `var(--font-mono)` / `var(--font-sans)`, never literal family names |

---

## Phase 0 — Foundation
### SERIAL. All agents wait until every one of these 10 files exists and is correct.
### These files define the contracts that every other file depends on.

---

### F0.1 — types/index.ts

**What it is:** The single source of all TypeScript types used across the entire project.
Every other file imports its types from here. No other file defines shared types.

**Imports:** Nothing.

**Exports:** All interfaces and type aliases listed below.

**What to put in it — write this exact content:**

```typescript
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

export interface CardPosition {
  id: string;
  side: SectionSide;
  yCenter: number;     // pixel y from top of scroll container (vertical center of card)
}

// ─── Store Types ───────────────────────────────────────────────────────────

export interface SiteStore {
  scrollT: number;                    // 0 to 1, normalised scroll position
  setScrollT: (t: number) => void;

  activeZone: ZoneName;               // derived from scrollT automatically

  activePanelId: string | null;       // id of currently open panel, null if none
  openPanel: (id: string) => void;
  closePanel: () => void;

  isLoading: boolean;
  setIsLoading: (value: boolean) => void;

  quality: QualityLevel;              // set once on mount based on device detection
  setQuality: (q: QualityLevel) => void;
}

// ─── Content Types ─────────────────────────────────────────────────────────

export interface BlogPost {
  slug: string;
  title: string;
  date: string;        // ISO date string, e.g. "2025-05-11"
  excerpt: string;
  content?: string;    // full MDX content, only present on individual post pages
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  href?: string;       // optional link to live project or case study
  year: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  stack: string[];     // technology tags
  href?: string;       // GitHub or live link
  status: 'live' | 'wip' | 'archived';
}
```

---

### F0.2 — config/sections.ts

**What it is:** The master control file. Adding, removing, renaming, or reordering sections
happens only here. Every other system derives its behaviour from this file automatically.

**Imports:** types/index.ts (SectionConfig)

**Exports:** SECTIONS

**Must NOT import:** Anything else.

**What to put in it — write this exact content:**

```typescript
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
```

**The enabled toggle rule:** Setting any section's enabled to false makes it vanish from
the spine, from the card grid, from the nav dots, and from the panel registry. It disappears
as if it never existed. No other file needs to be changed.

---

### F0.3 — config/world.ts

**What it is:** All the numbers that control the layout geometry. Change a number here and
the spine, cards, and scroll height all recalculate automatically.

**Imports:** Nothing.

**Exports:** All constants listed below.

**What to put in it — write this exact content:**

```typescript
// Height each section occupies, in pixels. Cards are vertically centred in this space.
// Default: one full viewport height per section.
// To make the page taller and more spacious, increase this.
export const SECTION_HEIGHT_PX = 900;

// Height before the first section anchor. Set to 800 to create a proper hero
// landing zone in the first viewport. The HeroSection component occupies this space.
export const HEADER_HEIGHT_PX = 800;

// Extra space after the last section anchor (for the footer zone and social links).
export const FOOTER_HEIGHT_PX = 300;

// Horizontal distance from viewport centre to each spine anchor point.
// Cards start 20px beyond the anchor (see B.1), so a card occupies from
// ±(CARD_OFFSET_PX + 20) to ±(CARD_OFFSET_PX + 20 + CARD_WIDTH_PX) from centre —
// 500px per side at the defaults. Below ~1100px-wide viewports cards approach the
// screen edge; lower this value if small laptops are a target.
export const CARD_OFFSET_PX = 200;

// Controls how smoothly the spine curves between anchors.
// This is the vertical distance of the bezier control handles.
// Higher = gentler S-curves. Lower = sharper turns.
export const SPINE_CONTROL_DISTANCE_PX = 220;

// Width of each content card in pixels.
export const CARD_WIDTH_PX = 280;

// Scroll T thresholds for zone changes.
// These determine at what scroll progress the environment zone changes.
// Adjust these to make zones longer or shorter.
export const ZONE_THRESHOLDS = {
  sky: 0,           // always starts here
  horizon: 0.35,    // spine enters the sea-level area
  sea: 0.55,        // fully at sea level
  underwater: 0.72, // below the surface
} as const;

// Mobile breakpoint. This value is intentionally duplicated in lib/useMobile.ts —
// that file's isolation rule forbids it from importing config/, so there is no way
// to share this constant. If you change this number, also change the literal 768
// inside lib/useMobile.ts (F0.10). Nothing will warn you if the two drift apart.
export const MOBILE_BREAKPOINT_PX = 768;
```

---

### F0.4 — config/theme.ts

**What it is:** All colour values as JavaScript constants. Used in Three.js materials
and anywhere CSS variables cannot reach (e.g. Canvas/WebGL).
The CSS custom properties version of these same colours lives in globals.css.

**Imports:** Nothing.

**Exports:** All colour constants.

**What to put in it — write this exact content:**

```typescript
export const COLORS = {
  accent:              '#00FFEE',
  accentDim:           'rgba(0, 255, 238, 0.3)',
  accentBorder:        'rgba(0, 255, 238, 0.2)',
  accentBorderHover:   'rgba(0, 255, 238, 0.7)',

  background:          '#080808',
  surface:             '#111111',
  elevated:            '#1A1A1A',

  textPrimary:         '#F2F2F2',
  textSecondary:       '#888888',
  textMuted:           '#444444',

  borderSubtle:        'rgba(255, 255, 255, 0.08)',
  borderVisible:       'rgba(255, 255, 255, 0.15)',

  spineBase:           '#1C1C1C',
  spinePulse:          '#00FFEE',
  spineProgress:       '#00FFEE',

  // Three.js expects hex numbers, not strings
  bgThree:             0x080808,
  accentThree:         0x00FFEE,
  fogThree:            0x080808,
} as const;
```

---

### F0.5 — lib/activeSections.ts

**What it is:** The derived list of enabled sections only. This is the single array that
every system consumes. When a section is toggled off in config/sections.ts, it
automatically disappears from this list without any other change.

**Imports:** config/sections.ts, types/index.ts

**Exports:** activeSections (ActiveSection[])

**What to put in it — write this exact content:**

```typescript
import { SECTIONS } from '@/config/sections';
import type { ActiveSection } from '@/types';

export const activeSections: ActiveSection[] = SECTIONS
  .filter((section) => section.enabled)
  .map((section, index) => ({
    ...section,
    index,
  }));
```

This file is intentionally tiny. Its entire value is in being the one place that combines
the filter with index assignment.

---

### F0.6 — store/useSiteStore.ts

**What it is:** The global state store using Zustand. Every component that needs to know
the scroll position, which panel is open, or the current zone reads from here. Nothing
reads these values through prop drilling or context — always through this store.

**Imports:** zustand (create), zustand/middleware (subscribeWithSelector), types/index.ts,
config/world.ts (ZONE_THRESHOLDS)

**Exports:** useSiteStore (the Zustand hook)

**Must NOT import:** Any component, any canvas/spine/card file.

**A note on the middleware:** This store is wrapped in `subscribeWithSelector`. Without it,
Zustand's base `subscribe` only accepts a single listener function — the two-argument
form used elsewhere in this plan (`subscribe(selector, callback)`, used in A.1 and E.5)
would silently fail: the selector would be accepted as the sole listener, the callback
would never run, and no error would be thrown anywhere. The middleware is what makes
that two-argument form actually work.

**What to put in it — write this exact content:**

```typescript
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
```

---

### F0.7 — lib/scrollSystem.ts

**What it is:** Initialises Lenis smooth scroll and writes the scroll progress (0 to 1)
into the store every animation frame.

**Imports:** lenis, store/useSiteStore.ts

**Exports:** initScrollSystem(), destroyScrollSystem(), scrollToY(), stopScroll(), startScroll()

**Must NOT import:** Any component file, any config file other than store.

**What to put in it — detailed specification:**

Create and export two functions: initScrollSystem and destroyScrollSystem.

initScrollSystem does the following:
1. Creates a new Lenis instance with these options: duration 1.4, easing function that is
   `(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))`, smoothWheel true, wheelMultiplier 0.9.
2. Starts an animation frame loop using requestAnimationFrame.
3. Inside the loop: calls lenis.raf(time), then computes scrollT as
   `lenis.scroll / Math.max(1, document.body.scrollHeight - window.innerHeight)`,
   then calls `useSiteStore.getState().setScrollT(scrollT)`.
4. Stores the RAF id so it can be cancelled.

destroyScrollSystem does:
1. Cancels the stored RAF id.
2. Calls lenis.destroy().

Three more exports round out the module — every other file goes through these instead
of touching Lenis or native scrolling directly:
- scrollToY(y): programmatic smooth scroll via lenis.scrollTo(). Native
  window.scrollTo({ behavior: 'smooth' }) is NOT intercepted by Lenis — never use it.
- stopScroll() / startScroll(): lock and unlock page scrolling while a panel overlay
  is open (called by PanelOverlay, C.0).

```typescript
import Lenis from 'lenis';
import { useSiteStore } from '@/store/useSiteStore';

let lenis: Lenis | null = null;
let rafId: number | null = null;

export function initScrollSystem(): void {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
  });

  function raf(time: number) {
    lenis!.raf(time);
    const scrollT =
      lenis!.scroll /
      Math.max(1, document.body.scrollHeight - window.innerHeight);
    useSiteStore.getState().setScrollT(Math.min(1, Math.max(0, scrollT)));
    rafId = requestAnimationFrame(raf);
  }

  rafId = requestAnimationFrame(raf);
}

export function destroyScrollSystem(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  if (lenis) lenis.destroy();
  lenis = null;
  rafId = null;
}

export function scrollToY(y: number): void {
  if (lenis) lenis.scrollTo(y);
  else window.scrollTo({ top: y });
}

export function stopScroll(): void {
  lenis?.stop();
}

export function startScroll(): void {
  lenis?.start();
}
```

---

### F0.8 — styles/globals.css

**What it is:** Base styles, CSS custom properties, Tailwind directives, global resets,
and reduced-motion accessibility rules.

**What to put in it — write this exact content:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-accent:           #00FFEE;
  --color-accent-dim:       rgba(0, 255, 238, 0.3);
  --color-accent-border:    rgba(0, 255, 238, 0.2);
  --color-accent-hover:     rgba(0, 255, 238, 0.7);

  --color-bg:               #080808;
  --color-surface:          #111111;
  --color-elevated:         #1A1A1A;

  --color-text-primary:     #F2F2F2;
  --color-text-secondary:   #888888;
  --color-text-muted:       #444444;

  --color-border-subtle:    rgba(255, 255, 255, 0.08);
  --color-border-visible:   rgba(255, 255, 255, 0.15);

  /* --font-sans and --font-mono are NOT defined here. They come from next/font/google
     in app/layout.tsx (I.2), applied via className on <html>. Defining them again here
     would create two conflicting values for the same CSS variable on the same element,
     and risks silently overriding the self-hosted font with a plain CDN-style string
     that has no @font-face backing it. Do not add font-family variables to this file. */

  --card-width:             280px;
  --card-radius:            4px;
  --panel-radius:           6px;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: auto; /* Lenis handles smooth scroll — do NOT set smooth here */
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* Spine pulse animation — used by Layer B of the SVG spine */
@keyframes spine-pulse {
  0%   { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -90; }
}

/* Hero scroll prompt animation — used by the HeroSection component */
@keyframes pulse-opacity {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.9; }
}

/* Panel enter/exit animations are handled by GSAP, not CSS */

/* Scrollbar styling */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--color-bg); }
::-webkit-scrollbar-thumb { background: var(--color-text-muted); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-accent); }

/* ─── Accessibility: Respect system motion preferences ─────────────────── */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

### F0.9 — lib/motion.ts

**What it is:** A utility that tells any component whether GSAP animations should run.
Reads the system's prefers-reduced-motion setting. Import this in every component that
uses GSAP before running any tween.

**Imports:** Nothing.

**Exports:** motionAllowed()

**Must NOT import:** Any component, store, or config file.

**What to put in it:**

```typescript
/**
 * Returns true if the user has NOT requested reduced motion.
 * Use before every GSAP call:
 *
 *   if (motionAllowed()) {
 *     gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1 });
 *   } else {
 *     gsap.set(ref.current, { opacity: 1 });
 *   }
 */
export function motionAllowed(): boolean {
  if (typeof window === 'undefined') return true;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

---

### F0.10 — lib/useMobile.ts

**What it is:** A React hook that returns true when the viewport is below the mobile
breakpoint (768px). Used to switch between desktop and mobile layouts. Updates on resize.
This file cannot import config/world.ts (see its isolation rule below), so 768 is hardcoded
here as a literal, duplicating MOBILE_BREAKPOINT_PX in config/world.ts (F0.3). If you ever
change one, change the other — there is no shared source for this number.

**Imports:** react (useState, useEffect)

**Exports:** useMobile() hook

**Must NOT import:** Any component, store, or config file.

**What to put in it:**

```typescript
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}
```

---

## Phase 1 — Core Systems
### These two files can be built in parallel with each other.
### They can start as soon as Phase 0 is complete.
### Track A and Track B of Phase 2 cannot start until their corresponding Phase 1 file is done.

---

### P1.A — lib/spinePathGenerator.ts

**What it is:** Takes the list of active sections and the viewport dimensions, and returns
a smooth SVG path string that curves through all section anchor points plus the anchor
point coordinates.

**Imports:** lib/activeSections.ts, config/world.ts, types/index.ts

**Exports:**
```typescript
function generateSpinePath(
  viewportWidth: number,
  totalHeight: number
): { d: string; anchors: SpineAnchor[] }
```

**Must NOT import:** Any component, store, or canvas file.

**What to put in it — detailed algorithm:**

The function computes anchor points, then constructs a smooth cubic bezier SVG path
through all of them.

Step 1 — Compute anchor points:
```
center = viewportWidth / 2

For each active section at index i:
  x = center + (side === 'right' ? +CARD_OFFSET_PX : -CARD_OFFSET_PX)
  y = HEADER_HEIGHT_PX + (i × SECTION_HEIGHT_PX) + (SECTION_HEIGHT_PX / 2)
```

Step 2 — Build path string:
The path starts at the top center, curves through each anchor with horizontal tangents
(so the curves are always smooth S-shapes), and ends at the bottom center.

```
Start point: (center, 0)
End point:   (center, totalHeight)

Path format:
M {center} 0
C {center} {ctrl}, {a0.x} {a0.y - ctrl}, {a0.x} {a0.y}
C {a0.x} {a0.y + ctrl}, {a1.x} {a1.y - ctrl}, {a1.x} {a1.y}
... repeat for each consecutive anchor pair ...
C {last.x} {last.y + ctrl}, {center} {totalHeight - ctrl}, {center} {totalHeight}

Where ctrl = SPINE_CONTROL_DISTANCE_PX (imported from config/world.ts)
```

Full implementation:

```typescript
import { activeSections } from '@/lib/activeSections';
import {
  SECTION_HEIGHT_PX,
  HEADER_HEIGHT_PX,
  CARD_OFFSET_PX,
  SPINE_CONTROL_DISTANCE_PX,
} from '@/config/world';
import type { SpineAnchor } from '@/types';

export function generateSpinePath(
  viewportWidth: number,
  totalHeight: number
): { d: string; anchors: SpineAnchor[] } {
  const center = viewportWidth / 2;
  const ctrl = SPINE_CONTROL_DISTANCE_PX;

  const anchors: SpineAnchor[] = activeSections.map((section) => ({
    id: section.id,
    side: section.side,
    x: center + (section.side === 'right' ? CARD_OFFSET_PX : -CARD_OFFSET_PX),
    y: HEADER_HEIGHT_PX + section.index * SECTION_HEIGHT_PX + SECTION_HEIGHT_PX / 2,
  }));

  // Build the SVG path d string
  const parts: string[] = [`M ${center} 0`];

  // First curve: from start point (center, 0) to first anchor
  if (anchors.length > 0) {
    const a0 = anchors[0];
    parts.push(`C ${center} ${ctrl}, ${a0.x} ${a0.y - ctrl}, ${a0.x} ${a0.y}`);
  }

  // Middle curves: between consecutive anchors
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    parts.push(
      `C ${a.x} ${a.y + ctrl}, ${b.x} ${b.y - ctrl}, ${b.x} ${b.y}`
    );
  }

  // Last curve: from final anchor to end point (center, totalHeight)
  if (anchors.length > 0) {
    const last = anchors[anchors.length - 1];
    parts.push(
      `C ${last.x} ${last.y + ctrl}, ${center} ${totalHeight - ctrl}, ${center} ${totalHeight}`
    );
  } else {
    // No active sections — straight vertical line
    parts.push(`L ${center} ${totalHeight}`);
  }

  return { d: parts.join(' '), anchors };
}
```

---

### P1.B — lib/cardPositioner.ts

**What it is:** Returns the vertical center position for each active section card. The
horizontal position is handled by CSS using the side value — this function only computes
vertical position.

**Imports:** lib/activeSections.ts, config/world.ts, types/index.ts

**Exports:**
```typescript
function getCardPositions(): CardPosition[]
```

**Must NOT import:** Any component, store, or spine file.

**What to put in it:**

```typescript
import { activeSections } from '@/lib/activeSections';
import { SECTION_HEIGHT_PX, HEADER_HEIGHT_PX } from '@/config/world';
import type { CardPosition } from '@/types';

export function getCardPositions(): CardPosition[] {
  return activeSections.map((section) => ({
    id: section.id,
    side: section.side,
    // Card is centred vertically within its section slot
    yCenter:
      HEADER_HEIGHT_PX +
      section.index * SECTION_HEIGHT_PX +
      SECTION_HEIGHT_PX / 2,
  }));
}
```

---

## Phase 2 — Parallel Tracks
### Tracks C, D, E, F, and G need only Phase 0 — they can begin immediately, in parallel
### with Phase 1. Track A begins once P1.A is done. Track B begins once P1.B is done.
### Phase 1 itself runs concurrently with all of Phase 2, not before it.

---

## Track A — Spine SVG
### Requires: P1.A (spinePathGenerator)

---

### A.1 — components/spine/SpineSVG.tsx

**What it is:** The full-page animated SVG that forms the visual backbone of the site.
Three overlapping path layers on the same curve: dim static base, travelling cyan pulse,
scroll-progress fill. Plus anchor nodes at each section point and a scroll position dot.

**Imports:**
- react (useEffect, useRef, useState)
- lib/spinePathGenerator.ts (generateSpinePath)
- store/useSiteStore.ts (useSiteStore)
- config/world.ts (HEADER_HEIGHT_PX, SECTION_HEIGHT_PX, FOOTER_HEIGHT_PX)
- lib/activeSections.ts (activeSections)

**Exports:** SpineSVG (default export)

**Props:**
```typescript
interface SpineSVGProps {
  totalHeight: number;
}
```

**Must NOT import:** Any panel, card, canvas, or UI component.

**What to put in it — detailed specification:**

This is a client component ('use client'). It renders a single SVG element.

State and refs:
- pathRef: useRef pointing to the middle path element (the progress fill path)
- dotRef: useRef pointing to the circle element (the scroll dot)
- pathString: string state, initialised by calling generateSpinePath on mount
- totalPathLength: number state, set after the SVG mounts using pathRef.current.getTotalLength()
- anchors: SpineAnchor[] state, set alongside pathString
- viewportWidth: number state, set from window.innerWidth on mount

On mount:
1. Set viewportWidth from window.innerWidth
2. Call generateSpinePath(window.innerWidth, totalHeight) to get the path d string and anchors
3. Set pathString and anchors state
4. Add a debounced window resize listener that regenerates the path on resize

After pathString is set (useEffect watching pathString and the ref):
1. Read totalPathLength from pathRef.current.getTotalLength()

Store subscription (direct DOM — no re-renders on every scroll tick):
```typescript
useEffect(() => {
  if (!pathRef.current || !dotRef.current || totalPathLength === 0) return;

  const unsubscribe = useSiteStore.subscribe(
    (state) => state.scrollT,
    (scrollT) => {
      const offset = totalPathLength * (1 - scrollT);
      pathRef.current!.style.strokeDashoffset = String(offset);
      const point = pathRef.current!.getPointAtLength(scrollT * totalPathLength);
      dotRef.current!.setAttribute('cx', String(point.x));
      dotRef.current!.setAttribute('cy', String(point.y));
    }
  );

  return () => unsubscribe();
}, [totalPathLength]);
```

The SVG element:
- position: absolute, top: 0, left: 0
- width: 100%, height: totalHeight px
- pointerEvents: none (so it never blocks card clicks)
- overflow: visible

Inside the SVG:

A filter definition for the cyan glow:
```svg
<defs>
  <filter id="spine-glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="3" result="blur"/>
    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
  </filter>
</defs>
```

Layer A — base path (always visible, dim, no animation):
- path element with d={pathString}
- stroke: #1C1C1C (from COLORS.spineBase or hardcoded)
- strokeWidth: 1.5
- fill: none
- opacity: 1

Layer B — pulse animation (travelling cyan dashes, infinite loop):
- path element with same d={pathString}
- stroke: #00FFEE
- strokeWidth: 2
- fill: none
- filter: url(#spine-glow)
- strokeDasharray: '60 30' (60px dash, 30px gap)
- CSS animation: spine-pulse 1.6s linear infinite (uses the @keyframes from globals.css)
- opacity: 0.7

Layer C — scroll progress fill (fills from top as user scrolls, driven by scrollT):
- path element with ref={pathRef}
- same d={pathString}
- stroke: #00FFEE
- strokeWidth: 1.5
- fill: none
- filter: url(#spine-glow)
- strokeDasharray={totalPathLength} (the full path length)
- Initial strokeDashoffset={totalPathLength} (starts invisible, fills as scrollT increases)
- opacity: totalPathLength > 0 ? 0.5 : 0 — before getTotalLength() has run,
  totalPathLength is 0, strokeDasharray is 0 (which SVG renders as a SOLID stroke),
  and the path would flash as a fully-lit cyan line for a frame. Hide it until the
  length is known.

Anchor nodes — after the three path layers, render one small circle per anchor point:
```typescript
{anchors.map((anchor) => (
  <circle
    key={anchor.id}
    cx={anchor.x}
    cy={anchor.y}
    r={3}
    fill="#080808"
    stroke="#00FFEE"
    strokeWidth={1.5}
    filter="url(#spine-glow)"
    opacity={0.6}
  />
))}
```
These are static circles at each section's anchor point — like circuit board junctions
or map pin nodes. They appear wherever the spine meets each section's horizontal position.

Scroll dot (the marker showing current position on the spine):
- circle element with ref={dotRef}
- r={5}
- fill: #00FFEE
- filter: url(#spine-glow)
- opacity: totalPathLength > 0 ? 1 : 0 (same first-frame flash guard as Layer C)
- Starts at cx={viewportWidth/2} cy={0}, updated via DOM subscription each frame

Important: the dashoffset and dot position are updated via direct DOM manipulation inside
a useEffect that subscribes to scrollT from the store using subscribe (not a hook render).
This is critical for performance — never use useState for scroll-driven animations.

---

## Track B — Card Grid
### Requires: P1.B (cardPositioner)

---

### B.1 — components/cards/Card.tsx

**What it is:** A single section card. Glass-style box with the section label and tagline.
Clicking opens the panel or navigates to /blog. Animates in when it enters the viewport.
Supports both desktop (absolute positioning) and mobile (relative positioning) layouts.

**Imports:**
- react (useRef, useEffect)
- next/link
- gsap
- lib/motion.ts (motionAllowed)
- store/useSiteStore.ts (useSiteStore)
- config/world.ts (CARD_OFFSET_PX)
- types/index.ts (ActiveSection, CardPosition)

**Exports:** Card (named export)

**Props:**
```typescript
interface CardProps {
  section: ActiveSection;
  position: CardPosition | null;  // null on mobile
  isMobile: boolean;
}
```

**Must NOT import:** Any spine, canvas, panel, or other card file.

**What to put in it — detailed specification:**

This is a client component ('use client').

Desktop positioning (isMobile === false):

The card is position: absolute within the scroll container. Its top is position.yCenter
with a translateY(-50%) so it is centred on that y coordinate. Its horizontal position
is determined by the side value. The spine anchor sits at centre ± CARD_OFFSET_PX; the
card begins 20px beyond the anchor so the anchor node circle stays visible at the
card's inner edge instead of disappearing underneath the card body:
- Left cards: right: calc(50% + ${CARD_OFFSET_PX + 20}px) — the card's right edge sits
  20px outside the anchor; the card extends leftward from there by its own width.
- Right cards: left: calc(50% + ${CARD_OFFSET_PX + 20}px) — mirrored.

Mobile positioning (isMobile === true):
- position: relative (not absolute)
- width: 100% (fills the stacked column container)
- No top/left/right overrides — the CardGrid's flex column handles layout

Shared styles (both modes):
- Width: 280px on desktop (var(--card-width)), 100% on mobile
- Background: rgba(8, 8, 8, 0.85)
- Backdrop-filter: blur(12px)
- Border: 1px solid rgba(0, 255, 238, 0.2) at rest, rgba(0, 255, 238, 0.7) on hover
- Border-radius: 4px (sharp, not rounded)
- Padding: 24px
- Transition on border-color: 0.25s ease

Content inside the card:
- Small label at top: section.label in Space Mono font, 11px, letter-spacing: 0.15em,
  text-transform: uppercase, color: var(--color-accent), opacity: 0.9
- Tagline: section.tagline in Space Grotesk, 13px, color: var(--color-text-secondary),
  margin-top: 8px, line-height: 1.6
- CTA text at bottom: "Open →" for panel types, "Read →" for route types.
  Color: var(--color-text-muted), 12px. On hover: var(--color-accent).

Entrance animation (GSAP, runs ONCE when card enters viewport):
Use IntersectionObserver. When card enters viewport with threshold 0.3:
```typescript
if (motionAllowed()) {
  gsap.fromTo(cardRef.current,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', delay: 0.1 * section.index }
  );
} else {
  gsap.set(cardRef.current, { opacity: 1, y: 0 });
}
```
The delay staggers cards slightly if they enter the viewport simultaneously.

Click handler and element semantics (matters for the Lighthouse accessibility target):
- If section.type === 'panel': render the card as a <button> (styled, textAlign left,
  default button styles fully reset) so it is keyboard-focusable and announces as
  interactive. onClick calls useSiteStore.getState().openPanel(section.id).
- If section.type === 'route': render the card as a next/link <Link> to section.href.
- Either way, aria-label: `Open ${section.label}`.

Initial state: opacity 0 (GSAP will reveal it on viewport entry).

---

### B.2 — components/cards/CardGrid.tsx

**What it is:** Renders all active section cards. On desktop: absolutely positioned grid.
On mobile: vertically stacked full-width column.

**Imports:**
- lib/activeSections.ts (activeSections)
- lib/cardPositioner.ts (getCardPositions)
- lib/useMobile.ts (useMobile)
- components/cards/Card.tsx (Card)

**Exports:** CardGrid (default export)

**Must NOT import:** Spine, panels, or canvas. (The cards/ directory is permitted to
import store per the isolation table — CardGrid itself just has no need to.)

**What to put in it:**

Client component ('use client').

```typescript
'use client';
import { activeSections } from '@/lib/activeSections';
import { getCardPositions } from '@/lib/cardPositioner';
import { useMobile } from '@/lib/useMobile';
import { Card } from '@/components/cards/Card';

export default function CardGrid() {
  const isMobile = useMobile();
  const positions = getCardPositions();

  if (isMobile) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        padding: '120px 24px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        pointerEvents: 'auto',
      }}>
        {activeSections.map((section) => (
          <Card key={section.id} section={section} position={null} isMobile={true} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {activeSections.map((section) => {
        const position = positions.find((p) => p.id === section.id);
        if (!position) return null;
        return (
          <div key={section.id} style={{ pointerEvents: 'auto' }}>
            <Card section={section} position={position} isMobile={false} />
          </div>
        );
      })}
    </div>
  );
}
```

---

## Track C — Panels
### Requires: Phase 0 only.
### C.1 through C.4 are fully independent of each other — build these first, in parallel.
### C.5 imports C.1 through C.4 — build it next, once they exist.
### C.0 imports C.5 (the registry) — build it last, after C.5 exists.

---

### C.0 — components/panels/PanelOverlay.tsx

**What it is:** The shared wrapper for all panels. Reads activePanelId from the store.
When a panel id is set, looks up the correct panel from the registry and renders it inside
a full-screen animated overlay. GSAP handles open/close transitions.

**Imports:**
- react (useEffect, useRef, useState)
- gsap
- lib/motion.ts (motionAllowed)
- lib/scrollSystem.ts (stopScroll, startScroll)
- store/useSiteStore.ts (useSiteStore)
- components/panels/index.ts (PANEL_REGISTRY)

**Exports:** PanelOverlay (default export)

**Must NOT import:** Individual panel files. No spine, card, or canvas.

**What to put in it — detailed specification:**

This is a client component ('use client').

The overlay renders as:
- Outer wrapper: position fixed, inset 0 (fills entire screen), z-index 50
- It renders even when no panel is open — but is invisible (opacity 0, pointerEvents none)
- GSAP animates opacity and pointerEvents based on whether activePanelId is set

State: `renderedPanelId` (string | null). When activePanelId becomes non-null, set
renderedPanelId to it immediately. When activePanelId goes back to null, do NOT clear
renderedPanelId yet — clear it in the close tween's onComplete. Otherwise the panel
content unmounts the instant the close starts and the overlay fades out over a blank
backdrop (R17).

Inner structure:
1. Backdrop: position absolute, inset 0, background rgba(5,5,5,0.92), backdrop-filter blur(24px)
2. Close button: position absolute, top 24px, right 24px. Icon X (from lucide-react).
   onClick calls useSiteStore.getState().closePanel()
3. Content area: position absolute, inset 0, overflow-y auto, padding 60px 40px.
   Max-width 860px, centred horizontally with margin: 0 auto.
   Add -webkit-overflow-scrolling: touch for smooth mobile scrolling.
   MUST carry the `data-lenis-prevent` attribute — without it Lenis swallows wheel
   events over the overlay and scrolls the page behind it instead of the panel (R16).
   This is where the panel component renders.

Opening animation (when activePanelId changes from null to a value). First call
stopScroll() to lock the page behind the overlay, and set renderedPanelId:
```typescript
if (motionAllowed()) {
  gsap.to(overlayRef.current, {
    opacity: 1, duration: 0.45, ease: 'power2.out',
    onStart: () => { overlayRef.current.style.pointerEvents = 'auto'; }
  });
  gsap.fromTo(contentRef.current,
    { y: 30 },
    { y: 0, duration: 0.45, ease: 'power2.out' }
  );
} else {
  overlayRef.current.style.opacity = '1';
  overlayRef.current.style.pointerEvents = 'auto';
}
```

Closing animation (when activePanelId changes from a value to null). Call startScroll()
to unlock the page again:
```typescript
if (motionAllowed()) {
  gsap.to(overlayRef.current, {
    opacity: 0, duration: 0.3, ease: 'power2.inOut',
    onComplete: () => {
      overlayRef.current.style.pointerEvents = 'none';
      setRenderedPanelId(null);   // unmount content only after the fade finishes
    }
  });
  gsap.to(contentRef.current, { y: 30, duration: 0.3, ease: 'power2.inOut' });
} else {
  overlayRef.current.style.opacity = '0';
  overlayRef.current.style.pointerEvents = 'none';
  setRenderedPanelId(null);
}
```

Panel lookup (note: renderedPanelId, not activePanelId — see above):
```typescript
const PanelComponent = renderedPanelId ? PANEL_REGISTRY[renderedPanelId] : null;
```
If no matching component found in registry, render a fallback message.

Also: pressing Escape key calls closePanel(). Add keydown listener on mount, remove on unmount.
Also: clicking the backdrop calls closePanel().
Also: on open, move focus to the close button; on close, restore focus to the element
that was focused before the panel opened (capture document.activeElement on open).

---

### C.1 — components/panels/AboutPanel.tsx

**What it is:** The About Me panel content. Contains a stat grid of impact metrics, bio,
skills, and stack.

**Imports:**
- react
- content/about.json (imported directly as JSON)

**Exports:** AboutPanel (named export)

**Must NOT import:** Any store, spine, card, or other panel file.

**Content file requirement:** content/about.json must exist before this file is complete.
See C.6 for the content file spec.

**What to put in it:**

Client component ('use client').

Reads the JSON file and renders its content. Structure of the rendered panel:

Section heading: "About Me", Space Mono, 11px, uppercase, letterSpacing 0.15em, accent colour.

Name/headline: aboutData.name, 32px, Space Grotesk weight 300, text-primary.
Role line: aboutData.headline, 14px, Space Mono, text-secondary, marginTop 8px.

Impact stat grid (four cells, 2-column grid):
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '16px',
  margin: '32px 0',
  padding: '24px',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '4px',
}}>
  {aboutData.stats.map((stat: { value: string; label: string }) => (
    <div key={stat.label} style={{ padding: '16px' }}>
      <p style={{
        fontSize: '28px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-accent)',
        fontWeight: 400,
      }}>
        {stat.value}
      </p>
      <p style={{
        fontSize: '11px',
        color: 'var(--color-text-muted)',
        marginTop: '4px',
        lineHeight: 1.5,
      }}>
        {stat.label}
      </p>
    </div>
  ))}
</div>
```

Bio paragraphs: 15px, Space Grotesk 400, text-secondary, lineHeight 1.8. Each string in
aboutData.bio renders as a separate <p> with marginBottom 16px.

Current focus: Small heading ("Currently") + paragraph from aboutData.currentFocus.

Skills section: small pill tags. Each pill: border 1px solid rgba(255,255,255,0.15),
padding 4px 12px, borderRadius 2px, fontSize 12px, font-mono, color text-secondary,
margin 4px.

Stack section: same pill style, pulled from aboutData.stack.

---

### C.2 — components/panels/PortfolioPanel.tsx

**What it is:** The Portfolio panel. Shows selected work items in a list layout.

**Imports:**
- react
- content/portfolio.json
- types/index.ts (PortfolioItem)

**Exports:** PortfolioPanel (named export)

**Must NOT import:** Any store, spine, card, or other panel file.

**Content file requirement:** content/portfolio.json must exist before this file is complete.
See C.7 for the content file spec.

**What to put in it:**

Client component ('use client').

Section heading: "Portfolio" in Space Mono, 13px uppercase tracking, cyan colour.

List of PortfolioItem entries. Each item:
- A horizontal divider line (1px, border-visible colour) above each item
- Title: 18px, Space Grotesk 500, text-primary
- Year: 12px, Space Mono, text-muted, float right or inline beside title
- Tags: small pill tags in a row (same pill style as skills in AboutPanel)
- Description: 14px, Space Grotesk 400, text-secondary, margin-top 8px
- Optional link: if href is present, render a small "View →" link in accent colour

---

### C.3 — components/panels/ProjectsPanel.tsx

**What it is:** The Projects panel. Shows technical projects with stack and status.

**Imports:**
- react
- content/projects.json
- types/index.ts (ProjectItem)

**Exports:** ProjectsPanel (named export)

**Must NOT import:** Any store, spine, card, or other panel file.

**Content file requirement:** content/projects.json must exist before this file is complete.
See C.8 for the content file spec.

**What to put in it:**

Client component ('use client').

Section heading: "Projects" in Space Mono, 13px uppercase tracking, cyan colour.

Similar layout to PortfolioPanel but with status indicators:
- Status badge: small coloured dot + text. 'live' = accent green (#22c55e approximation),
  'wip' = amber (#f59e0b), 'archived' = text-muted. Render as a small inline pill
  before the title or in the top-right corner of each item.
- Stack tags: same pill style as portfolio tags.
- Description and optional href link.
- If href is present, render "View on GitHub →" or "View live →" in accent colour.

---

### C.4 — components/panels/PlaceholderPanel.tsx

**What it is:** Panel for the disabled Placeholder section. Shows "coming soon" message.

**Imports:** react only.

**Exports:** PlaceholderPanel (named export)

**What to put in it:**

Minimal panel content. Centred vertically and horizontally:
- Text: "This section is coming soon." in text-muted, 14px
- A small pulsing dot in accent colour below (CSS pulse-opacity animation, 1.4s)

---

### C.5 — components/panels/index.ts

**What it is:** The panel registry. Maps section ids to their panel components.
The only file that imports all panel components.

**Imports:** All four panel components, react (ComponentType)

**Exports:** PANEL_REGISTRY

**Must NOT import:** Store, spine, card, or canvas.

**What to put in it:**

```typescript
import { AboutPanel }       from './AboutPanel';
import { PortfolioPanel }   from './PortfolioPanel';
import { ProjectsPanel }    from './ProjectsPanel';
import { PlaceholderPanel } from './PlaceholderPanel';
import type { ComponentType } from 'react';

export const PANEL_REGISTRY: Record<string, ComponentType> = {
  about:       AboutPanel,
  portfolio:   PortfolioPanel,
  projects:    ProjectsPanel,
  placeholder: PlaceholderPanel,
  // Blog is type 'route' — it never opens a panel, so it is not registered here.
};
```

To add a panel for a new section in future: create the panel component, import it
here, add one line to the registry object. Nothing else changes.

---

### C.6 — content/about.json

**What it is:** Source of truth for the About Me panel. Edit this file to update content
without touching any code.

**What to put in it:**

```json
{
  "name": "Sidakpreet Singh",
  "headline": "Manager · Strategy & GTM · HCLSoftware",
  "tagline": "IIM Indore MBA · B.Pharm (DPSRU) · Bain & Company",
  "bio": [
    "Strategy and GTM professional with 2 years of post-MBA experience at HCLSoftware, working across three interconnected verticals: Product GTM for Aftermarket Cloud India, Product Strategy for Growth Markets and VoltMX, and Sales Strategy for the India public sector.",
    "Built a 0-to-1 GTM motion across 75+ accounts and activated 20+ SI partnerships. Defined 55+ product features across 10+ buyer personas and 15+ sector use cases. Closed the public sector year with $8M in pipeline and over $1.5M in ACV — as the function's founding year.",
    "Previously a Summer Associate at Bain & Company. MBA from IIM Indore (top 2%, Strategic Management cohort). B.Pharm from DPSRU, Delhi."
  ],
  "currentFocus": "Active job search targeting Strategy Consulting (MBB, Deloitte S&O, EY-P), GTM/Commercial Strategy, Product Strategy, and BizOps roles at companies such as Mastercard, Visa, and select high-growth firms. Open to relocation.",
  "stats": [
    { "value": "~$4M", "label": "Pipeline built (Aftermarket Cloud)" },
    { "value": ">$1.5M", "label": "ACV closed (Public Sector Yr 1)" },
    { "value": "75+", "label": "Accounts developed" },
    { "value": "20+", "label": "SI partnerships activated" }
  ],
  "skills": [
    "GTM Strategy", "Product Strategy", "Sales Strategy", "Market Entry",
    "Competitive Analysis", "Partner Ecosystem", "Case Frameworks",
    "Stakeholder Management", "Business Storytelling", "Data Analysis"
  ],
  "stack": [
    "Excel (Advanced)", "PowerPoint (Advanced)", "Alteryx (Intermediate)",
    "Tableau (Intermediate)", "SQL (Intermediate)", "Python (Foundational)", "Notion"
  ]
}
```

---

### C.7 — content/portfolio.json

**What it is:** Source of truth for Portfolio panel items. Add or edit entries here.

**What to put in it:**

```json
[
  {
    "id": "aftermarket-cloud-india",
    "title": "Aftermarket Cloud India — 0-to-1 GTM Build",
    "year": "2024–25",
    "description": "Built the full GTM motion from scratch for a new SaaS product entering the Indian market. Developed the ICP and account segmentation across 75+ targets, generated ~$4M in qualified pipeline, and activated 20+ SI relationships producing ~$2.5M in net-new partner pipeline. Established positioning, outreach playbooks, and SI onboarding frameworks.",
    "tags": ["GTM Strategy", "Product GTM", "Partner Activation", "Pipeline Development"],
    "href": null
  },
  {
    "id": "voltmx-growth-markets",
    "title": "VoltMX Product Strategy — Growth Markets",
    "year": "2024",
    "description": "Led product strategy and requirements definition for the VoltMX low-code platform across growth markets. Authored 55+ structured feature definitions, mapped 10+ distinct buyer personas, and developed 15+ sector-specific use cases spanning BFSI, healthcare, and the India public sector.",
    "tags": ["Product Strategy", "Low-Code", "Feature Definition", "Persona Research"],
    "href": null
  },
  {
    "id": "india-public-sector",
    "title": "India Public Sector — Sales Strategy, Year 1",
    "year": "2023–24",
    "description": "Stood up the sales strategy function for the India public sector vertical — the founding year of the practice. Built a $8M pipeline across 60+ accounts and closed >$1.5M in ACV. Developed account intelligence frameworks, competitive battle cards, and the full sector engagement playbook.",
    "tags": ["Sales Strategy", "Public Sector", "Revenue Generation", "Account Planning"],
    "href": null
  },
  {
    "id": "bain-summer-associate",
    "title": "Bain & Company — Summer Associate",
    "year": "Apr–Jun 2023",
    "description": "Worked on client engagements applying hypothesis-driven problem structuring, data-driven insight generation, and executive-ready communication under senior guidance.",
    "tags": ["Strategy Consulting", "Problem Structuring", "Client Engagement"],
    "href": null
  },
  {
    "id": "national-consulting-olympiad",
    "title": "National Consulting Olympiad — 4th Nationally",
    "year": "2022",
    "description": "Competed in the National Consulting Olympiad out of IIM Indore. Ranked 4th nationally across 300+ teams through multiple elimination rounds solving business strategy cases under strict time constraints.",
    "tags": ["Case Competition", "Strategy", "IIM Indore"],
    "href": null
  }
]
```

---

### C.8 — content/projects.json

**What it is:** Source of truth for Projects panel items.

**What to put in it:**

```json
[
  {
    "id": "health-ledger",
    "title": "Health Ledger",
    "description": "Single-page health tracking application with Firebase authentication, daily habit/metric logging, and interactive visualisations. Built in Vanilla JS. Deployed on Vercel. Development partially automated via an agentic workflow (OpenHands + Gemini).",
    "stack": ["JavaScript", "Firebase", "Vercel", "EmailJS"],
    "href": null,
    "status": "live"
  },
  {
    "id": "notion-backup-system",
    "title": "Notion Backup System",
    "description": "Automated daily backup pipeline for Notion workspaces. Generates a full export, builds a manifest file, archives to Google Drive via rclone, and sends SMTP completion notifications. Runs unattended via GitHub Actions.",
    "stack": ["Node.js", "GitHub Actions", "rclone", "Google Drive API"],
    "href": "https://github.com/ItsMonarch04/NotionBackups",
    "status": "live"
  },
  {
    "id": "local-ai-stack",
    "title": "Local AI Automation Stack",
    "description": "Offline AI infrastructure running Ollama (local model server), Open WebUI (chat interface), and n8n (workflow automation) on both Mac and Windows. Fully air-gapped — no data leaves the device. Includes full setup documentation in Notion.",
    "stack": ["Ollama", "Open WebUI", "n8n", "Docker"],
    "href": null,
    "status": "live"
  },
  {
    "id": "personal-website",
    "title": "This Website",
    "description": "Personal portfolio with an animated SVG spine, WebGL atmospheric effects, GSAP-driven panel overlays, and an MDX blog system.",
    "stack": ["Next.js 15", "TypeScript", "Three.js", "GSAP", "Lenis", "Zustand"],
    "href": null,
    "status": "wip"
  }
]
```

---

## Track D — WebGL Atmosphere
### Requires: Phase 0 only.
### Optional for v0.1 — the site works without it. Skip for first launch, add in v0.2.
### D.3 can be built alongside D.1. D.2 requires both D.1 and D.3 to be done.

---

### D.1 — components/canvas/ExperienceCanvas.tsx

**What it is:** The R3F Canvas element. Renders in a fixed position behind the entire
page. Used only for atmospheric effects (particles, subtle fog). NOT used for the spine.

**Imports:**
- react
- @react-three/fiber (Canvas)
- components/canvas/Scene.tsx (Scene)

**Exports:** ExperienceCanvas (default export)

**Must NOT import:** Any spine, card, panel, or UI component.

**What to put in it:**

This is a client component ('use client'). It is dynamically imported in app/page.tsx
with `{ ssr: false }` to prevent server-side rendering errors with WebGL, and rendered
only on desktop — page.tsx conditionally renders it based on useMobile.

Renders a div that is:
- position: fixed
- top: 0, left: 0
- width: 100vw, height: 100vh
- zIndex: 0
- pointerEvents: none (never blocks interaction)

Inside that div, the R3F Canvas with:
- gl={{ antialias: true, alpha: true }}
- camera={{ position: [0, 0, 5], fov: 75 }}
- style={{ background: 'transparent' }}

Inside Canvas: renders Scene component.

---

### D.2 — components/canvas/Scene.tsx

**What it is:** The root 3D scene. Mounts all atmospheric sub-components and sets up
lighting. Reads from store to adjust based on current zone.

**Imports:**
- react
- @react-three/fiber (useThree, useFrame)
- three (FogExp2)
- store/useSiteStore.ts
- components/canvas/SkyParticles.tsx

**Exports:** Scene (named export)

**What to put in it:**

Three.js scene setup:
- Ambient light: intensity 0.3, colour 0x111111
- FogExp2: colour 0x080808, density that increases slightly as scrollT increases.
  Read scrollT from store via subscribe, update fog density directly on scene.
  At scrollT=0: density 0.01. At scrollT=1: density 0.08.

Mount SkyParticles only when activeZone is 'sky' or 'horizon'.

---

### D.3 — components/canvas/SkyParticles.tsx

**What it is:** 200 slowly drifting small white particles — high-altitude mist. Sky and
horizon zones only.

**Imports:**
- react (useRef)
- @react-three/fiber (useFrame)
- three (InstancedMesh, Object3D, MeshBasicMaterial, SphereGeometry)

**Exports:** SkyParticles (named export)

**What to put in it — detailed specification:**

Creates an InstancedMesh of 200 tiny spheres (radius 0.015, white, basic material).
On each frame, each particle drifts very slowly upward and slightly sideways. When a
particle drifts above the camera, it resets to the bottom. This creates a seamless
loop of slow drifting particles.

Initial positions: randomly distributed in a 20×20×10 box around the origin.
Drift speed: 0.001 units per frame upward, tiny random XZ wobble.
Opacity: 0.4.

---

## Track E — UI Shell
### Requires: Phase 0 only.
### All six files in this track are independent of each other.

---

### E.1 — components/ui/LoadingScreen.tsx

**What it is:** A full-screen cover shown while the page initialises. Shows a terminal-style
boot sequence of 4 lines. Disappears after the sequence completes. Owns the loading duration
(sets isLoading false after all lines animate — do NOT set isLoading false elsewhere).

**Imports:**
- react (useEffect, useRef, useState)
- gsap
- lib/motion.ts (motionAllowed)
- store/useSiteStore.ts (useSiteStore)

**Exports:** LoadingScreen (default export)

**What to put in it:**

Client component ('use client'). Manages a `visible` boolean state (starts true). When not
visible, returns null.

The four boot lines:
```typescript
const BOOT_LINES = [
  'INITIALISING SCROLL ENGINE',
  'LOADING SECTION MANIFESTS',
  'CALIBRATING SPINE GEOMETRY',
  'MOUNTING ATMOSPHERIC LAYER',
];
```

A `revealedCount` state (starts 0). A useEffect on mount:
- Sets a timeout every 280ms to increment revealedCount by 1
- After all 4 lines are revealed (280 × 4 = 1120ms) + 600ms buffer:
  - Fades the screen out via GSAP (or instant if motionAllowed() false)
  - After fade: calls useSiteStore.getState().setIsLoading(false), then setVisible(false)

Each line renders only when its index < revealedCount:

```tsx
{BOOT_LINES.map((line, i) => (
  <div key={line} style={{
    display: 'flex', gap: '16px', alignItems: 'center',
    opacity: i < revealedCount ? 1 : 0,
    transition: 'opacity 0.15s ease',
  }}>
    <span style={{
      color: '#444444', width: '260px', fontSize: '11px',
      letterSpacing: '0.12em', textTransform: 'uppercase',
      fontFamily: 'var(--font-mono)',
    }}>
      {line}
    </span>
    <div style={{
      width: '120px', height: '2px',
      background: 'rgba(0,255,238,0.15)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, height: '100%',
        width: i < revealedCount ? '100%' : '0%',
        background: '#00FFEE', transition: 'width 0.22s ease-out',
      }} />
    </div>
    <span style={{
      color: '#00FFEE', fontSize: '10px', letterSpacing: '0.15em',
      fontFamily: 'var(--font-mono)',
      opacity: i < revealedCount ? 1 : 0,
    }}>
      DONE
    </span>
  </div>
))}
```

Outer screen: position fixed, inset 0, zIndex 100, background #080808. Content: flex
column, alignItems center, justifyContent center, gap 12px.

Fade-out GSAP call (on the screenRef, power2.inOut, 0.6s). After fade: setVisible(false).
If !motionAllowed(): skip animation, call setIsLoading and setVisible immediately.

---

### E.2 — components/ui/NavDots.tsx

**What it is:** A vertical column of dots, one per active section, fixed to the right side.
The active dot is highlighted in cyan. Clicking a dot scrolls to that section. Hidden on
mobile.

**Imports:**
- react (useEffect, useState)
- store/useSiteStore.ts (useSiteStore)
- lib/activeSections.ts (activeSections)
- lib/useMobile.ts (useMobile)
- lib/scrollSystem.ts (scrollToY)
- config/world.ts (SECTION_HEIGHT_PX, HEADER_HEIGHT_PX, FOOTER_HEIGHT_PX)

**Exports:** NavDots (default export)

**Must NOT import:** Any spine, card, panel, or canvas file.

**What to put in it — detailed specification:**

Client component ('use client').

```typescript
const isMobile = useMobile();
if (isMobile) return null;
```

Fixed position: right: 24px, top: 50%, transform: translateY(-50%).
Column of dots with 16px gap between them.

Active section index calculation. Two things matter here: (1) scrollT spans the whole
page including the 800px header and 300px footer, so a naive `scrollT × sectionCount`
drifts out of alignment with the real section boundaries — convert back to pixels and
compare against the actual section slots; (2) read it through a derived Zustand selector
so the component re-renders only when the index changes, not on every scroll frame:
```typescript
const totalHeight =
  HEADER_HEIGHT_PX + activeSections.length * SECTION_HEIGHT_PX + FOOTER_HEIGHT_PX;

const activeSectionIndex = useSiteStore((s) => {
  if (typeof window === 'undefined') return 0;
  const scrollPx = s.scrollT * Math.max(0, totalHeight - window.innerHeight);
  const viewportCenter = scrollPx + window.innerHeight / 2;
  const raw = Math.floor((viewportCenter - HEADER_HEIGHT_PX) / SECTION_HEIGHT_PX);
  return Math.min(Math.max(raw, 0), activeSections.length - 1);
});
```

Each dot:
- Width/height: 6px, border-radius: 50%
- Active: background var(--color-accent), box-shadow 0 0 6px var(--color-accent)
- Inactive: background var(--color-text-muted)
- On hover: background var(--color-accent) at 50% opacity
- Transition: background 0.3s ease, box-shadow 0.3s ease
- Cursor: pointer

On click, scroll to the section's vertical position. Native
window.scrollTo({ behavior: 'smooth' }) is NOT intercepted by Lenis — use the
scrollToY helper from lib/scrollSystem.ts, which goes through lenis.scrollTo():
```typescript
const targetY = HEADER_HEIGHT_PX + index * SECTION_HEIGHT_PX;
scrollToY(targetY);
```

Also render the section label as a tooltip that appears on dot hover:
- Tooltip: position absolute, right: 18px, background elevated surface,
  padding: 4px 8px, border-radius: 2px, font-size: 11px, Space Mono, white-space: nowrap.
- Appears on hover with opacity transition 0.2s ease.

---

### E.3 — components/ui/EmailIcon.tsx

**What it is:** Fixed email icon, bottom-right. A mailto link. The primary contact point.

**Imports:**
- lucide-react (Mail)

**Exports:** EmailIcon (default export)

**What to put in it:**

```typescript
import { Mail } from 'lucide-react';

export default function EmailIcon() {
  return (
    <a
      href="mailto:sps.daemon@gmail.com"
      aria-label="Send me an email"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '42px',
        height: '42px',
        borderRadius: '4px',
        border: '1px solid rgba(0, 255, 238, 0.2)',
        background: 'rgba(8, 8, 8, 0.8)',
        backdropFilter: 'blur(8px)',
        color: 'var(--color-text-secondary)',
        transition: 'border-color 0.25s ease, color 0.25s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,238,0.7)';
        (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,238,0.2)';
        (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
      }}
    >
      <Mail size={16} strokeWidth={1.5} />
    </a>
  );
}
```

Already set to the real address (sps.daemon@gmail.com) — swap it only if a
domain-based address gets set up later.

---

### E.4 — components/ui/DepthIndicator.tsx

**What it is:** Small fixed label bottom-left showing the current zone. Hidden on mobile.

**Imports:**
- react (useState, useEffect)
- store/useSiteStore.ts (useSiteStore)
- lib/useMobile.ts (useMobile)

**Exports:** DepthIndicator (default export)

**What to put in it — detailed specification:**

Client component ('use client').

```typescript
const isMobile = useMobile();
if (isMobile) return null;
```

Subscribes to activeZone from the store. Zone labels:
- sky:        '— ABOVE SEA LEVEL —'
- horizon:    '— SEA LEVEL —'
- sea:        '— SURFACE —'
- underwater: '— BELOW SEA LEVEL —'

Position: fixed, bottom: 28px, left: 28px, zIndex: 10.
Font: Space Mono, 10px, letter-spacing: 0.15em, color: var(--color-text-muted).
Transition: opacity 0.4s ease when zone changes (brief fade out → update text → fade in).
Implement with useEffect watching activeZone: fade to opacity 0, then after 0.2s
update the displayed text, then fade back to opacity 0.4.

---

### E.5 — components/ui/HeroSection.tsx

**What it is:** The landing content rendered in the 800px header zone. The first thing a
visitor sees after the loading screen fades out. Contains the site owner's name, role, and
a scroll prompt. Animates in via GSAP after isLoading becomes false.

**Imports:**
- react (useEffect, useRef, useState)
- gsap
- lib/motion.ts (motionAllowed)
- store/useSiteStore.ts (useSiteStore)

**Exports:** HeroSection (default export)

**Must NOT import:** Any spine, card, panel, canvas, or config file.

**What to put in it:**

Client component ('use client').

Position and layout:
- position: absolute
- top: 0, left: 0, width: 100%
- height: 800px (matches HEADER_HEIGHT_PX — hardcoded here to avoid coupling)
- display: flex, flexDirection: column, alignItems: center, justifyContent: center
- gap: 16px
- pointerEvents: none

Content (innermost div, maxWidth 600px, textAlign center):

Refs: tagRef, nameRef, roleRef, scrollRef.

All four elements start at opacity 0. The GSAP timeline runs once when isLoading
becomes false (subscribe to store — do not use useSiteStore hook to avoid re-renders):

```typescript
useEffect(() => {
  const unsubscribe = useSiteStore.subscribe(
    (state) => state.isLoading,
    (isLoading) => {
      if (!isLoading) {
        if (motionAllowed()) {
          const tl = gsap.timeline({ delay: 0.2 });
          tl.fromTo(tagRef.current,
            { opacity: 0, y: -8 }, { opacity: 0.7, y: 0, duration: 0.5, ease: 'power2.out' })
           .fromTo(nameRef.current,
            { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.2')
           .fromTo(roleRef.current,
            { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
           .fromTo(scrollRef.current,
            { opacity: 0 }, { opacity: 0.4, duration: 0.5, ease: 'power2.out' }, '-=0.1');
        } else {
          gsap.set([tagRef.current, nameRef.current, roleRef.current], { opacity: 1 });
          gsap.set(scrollRef.current, { opacity: 0.4 });
        }
        unsubscribe();
      }
    }
  );
  return () => unsubscribe();
}, []);
```

Rendered elements:

System tag (ref={tagRef}, initial opacity 0):
- Text: "— SIGNAL RECEIVED —"
- Font: Space Mono, 11px, letterSpacing 0.25em, color #00FFEE, opacity 0.7 when visible
- textTransform: uppercase

Name (ref={nameRef}, initial opacity 0):
- Text: "Sidakpreet Singh"
- Font: Space Grotesk, weight 300, fontSize clamp(36px, 5vw, 52px)
- Color: var(--color-text-primary)

Role line (ref={roleRef}, initial opacity 0):
- Text: "Strategy & GTM  ·  HCLSoftware  ·  IIM Indore"
- Font: Space Mono, 12px, letterSpacing 0.15em, color var(--color-text-secondary)
- Use the · character (U+00B7)

Scroll prompt (ref={scrollRef}, initial opacity 0):
- Text: "scroll to descend  ↓"
- Font: Space Mono, 10px, letterSpacing 0.2em, color var(--color-text-muted)
- CSS animation: pulse-opacity 2s ease-in-out infinite (from globals.css)
- marginTop: 24px
- Once it has faded in (after the entrance timeline above), a second subscription
  fades it back out as soon as the person starts scrolling:

```typescript
useEffect(() => {
  const unsubscribe = useSiteStore.subscribe(
    (state) => state.scrollT,
    (scrollT) => {
      if (scrollT > 0.02 && scrollRef.current) {
        scrollRef.current.style.animation = 'none';
        if (motionAllowed()) {
          gsap.to(scrollRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        } else {
          scrollRef.current.style.opacity = '0';
        }
      }
    }
  );
  return () => unsubscribe();
}, []);
```

This is a second, separate `useEffect` from the entrance-animation one above — it runs
for the lifetime of the component rather than unsubscribing after one fire.

---

### E.6 — components/ui/FooterSection.tsx

**What it is:** A subtle closing section rendered in the 300px footer zone at the bottom
of the page. LinkedIn and GitHub social links plus an end-of-transmission tag.

**Imports:** react only (inline SVG icons — no external icon library needed).

**Exports:** FooterSection (default export)

**Must NOT import:** Store, spine, panels, canvas.

**What to put in it:**

```typescript
export default function FooterSection() {
  const linkStyle = {
    color: '#444444',
    transition: 'color 0.25s ease',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '300px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      pointerEvents: 'auto',
    }}>
      {/* Vertical fade-in line */}
      <div style={{
        width: '1px',
        height: '48px',
        background: 'linear-gradient(to bottom, transparent, rgba(0,255,238,0.25))',
      }} />

      {/* Social link row */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <a
          href="https://www.linkedin.com/in/sidakpreet-singh/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          style={linkStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#00FFEE'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
        >
          {/* LinkedIn SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect x="2" y="9" width="4" height="12"/>
            <circle cx="4" cy="4" r="2"/>
          </svg>
        </a>
        <a
          href="https://github.com/ItsMonarch04"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          style={linkStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#00FFEE'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
        >
          {/* GitHub SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
        </a>
      </div>

      {/* End tag */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        letterSpacing: '0.2em',
        color: '#2A2A2A',
        textTransform: 'uppercase',
      }}>
        — end of transmission —
      </p>
    </div>
  );
}
```

---

## Track F — Blog Route
### Requires: Phase 0 only.
### F.1 must be built before F.2 and F.3.
### F.4 and F.5 can be built in parallel with F.2/F.3.
### F.6 and F.7 are content-only (no code dependencies) — write them any time.

---

### F.1 — lib/blog.ts

**What it is:** Server-side utility functions that read MDX files from content/blog and
return structured data.

**Imports:**
- fs (Node.js built-in)
- path (Node.js built-in)
- gray-matter
- types/index.ts (BlogPost)

**Exports:** getAllPosts(), getPostBySlug()

**Must NOT import:** Any component, store, canvas, or config file.

**What to put in it:**

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { BlogPost } from '@/types';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));

  return files
    .map((filename) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
      const { data } = matter(raw);
      return {
        slug: data.slug || filename.replace('.mdx', ''),
        title: data.title || 'Untitled',
        date: data.date || '',
        excerpt: data.excerpt || '',
      } as BlogPost;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || '',
    excerpt: data.excerpt || '',
    content,
  };
}
```

---

### F.2 — app/blog/page.tsx

**What it is:** The blog index page. Lists all posts. Clean readable layout.

**Imports:** lib/blog.ts (getAllPosts)

**Exports:** Default page component (Server Component, no 'use client')

**What to put in it — detailed specification:**

Server component. Calls getAllPosts() at the top to get the sorted posts array.

Layout:
- Max width 720px, centred, padding 80px 24px
- Background: var(--color-bg), same as rest of site
- Back link at top: "← Home" linking to /, font-mono 12px, accent colour
- Page heading: "Writing" in Space Grotesk 300, 40px, text-primary
- Subheading: "Ideas on strategy, systems, and building." in text-secondary, 15px
- Horizontal rule (1px, border-visible colour)
- List of posts: each post is a link to /blog/[slug]
  - Date: 12px, Space Mono, text-muted
  - Title: 18px, Space Grotesk 500, text-primary, hover: accent colour
  - Excerpt: 14px, text-secondary, margin-top 4px
  - Gap between posts: 40px
- If no posts exist: render "Nothing here yet. Come back soon." in text-muted.

---

### F.3 — app/blog/[slug]/page.tsx

**What it is:** Individual blog post page.

**Imports:**
- next/navigation (notFound)
- lib/blog.ts (getPostBySlug, getAllPosts)
- next-mdx-remote/rsc (MDXRemote)
- components/blog/PostHeader.tsx
- components/blog/PostBody.tsx

**Exports:** Default page component and generateStaticParams.

**What to put in it — detailed specification:**

Server component.

generateStaticParams: returns all post slugs so Next.js pre-builds all post pages:
```typescript
export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}
```

Main component: this is Next.js 15, where dynamic route params arrive as a Promise, not
a plain object. The component must be async and await params before using it:

```typescript
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <PostHeader post={post} />
      <PostBody>
        <MDXRemote source={post.content ?? ''} />
      </PostBody>
    </>
  );
}
```

The `post.content ?? ''` fallback matters: BlogPost's `content` field is typed optional
(it's absent on the list returned by getAllPosts), so TypeScript sees `string | undefined`
even though getPostBySlug always populates it. MDXRemote's `source` prop requires a plain
`string` — passing `post.content` directly fails `tsc --noEmit`. The `?? ''` satisfies the
type without changing behaviour, since `notFound()` already guarantees `post` came from
getPostBySlug, not the list view.

---

### F.4 — components/blog/PostHeader.tsx

**What it is:** Post title, date, and back link.

**Imports:** types/index.ts (BlogPost)

**Exports:** PostHeader (named export)

**Props:** post: BlogPost

**What to put in it — detailed specification:**

Not a client component (pure display, no interactivity).

Layout:
- Back link: "← Writing" linking to /blog, font-mono 12px, accent colour
- Post title: Space Grotesk 300, 36px, text-primary, margin-top: 40px
- Date: Space Mono 12px, text-muted, margin-top: 12px, formatted as "11 May 2025"
  (day + abbreviated month + year)
- Horizontal rule: 1px, border-visible, margin: 32px 0

---

### F.5 — components/blog/PostBody.tsx

**What it is:** MDX content wrapper with reading-optimised typography.

**Imports:** react

**Exports:** PostBody (named export)

**Props:** children: React.ReactNode

**What to put in it — detailed specification:**

A div wrapper with styles that set:
- Max-width: 68ch (characters — ideal line length for reading)
- Font: Space Grotesk 400, 16px, line-height: 1.85, color: text-primary
- Headings: text-primary, appropriate sizes (h2: 22px, h3: 18px), margin-top: 40px
- Paragraphs: margin-bottom: 24px, color: text-secondary (slightly dimmer than headings)
- Code blocks: Space Mono, 13px, background: elevated, padding: 16px, border-radius: 4px,
  border: 1px solid border-subtle
- Inline code: Space Mono, 13px, background: elevated, padding: 2px 6px, border-radius: 2px
- Links: accent colour, no underline at rest, underline on hover
- Blockquotes: left border 2px solid accent-dim, padding-left: 16px, color: text-muted,
  font-style: italic

---

### F.6 — content/blog/ai-substitution-myth.mdx

**What it is:** First published blog post — seeded from the LinkedIn series.

**What to put in it:**

```mdx
---
title: "The AI Substitution Myth"
date: "2025-05-11"
excerpt: "Most conversations about AI and knowledge work focus on the wrong threat. The problem isn't replacement — it's something subtler and more structural."
slug: "ai-substitution-myth"
---

Most conversations about AI and knowledge workers ask the wrong question.

The question isn't whether AI will *replace* you. The more accurate question is what
changes when AI handles the parts of thinking that used to take effort.

When research, drafting, and synthesis become near-instantaneous, the bottleneck shifts.
What becomes scarce is not raw cognitive output — it's judgment about *what to produce
and for whom*.

This is the first post in a six-part series on the second-order cognitive effects of
AI on knowledge workers. The series is not about fear. It's about a clear-eyed look
at what changes — and what doesn't.

*More to follow.*
```

---

### F.7 — content/blog/the-abundance-trap.mdx

**What it is:** Second published blog post.

**What to put in it:**

```mdx
---
title: "The Abundance Trap"
date: "2025-05-11"
excerpt: "When information and output become infinitely abundant, the problem isn't too little — it's too much, too fast, with no natural filter."
slug: "the-abundance-trap"
---

The Abundance Trap is simple to describe: when producing *anything* becomes trivially easy,
producing *the right thing* becomes proportionally harder.

A strategy deck that took three days now takes three hours. The bottleneck isn't creation.
It's selection — which insights to surface, which framing to choose, which ask to make.

In a world of scarce output, the quality filter was built into the production process.
Effort was the filter. Now that effort is compressed, the filter has to be reconstructed
deliberately.

This is what I mean by the Abundance Trap. The supply side of knowledge work has been
transformed. The demand side hasn't caught up.

*Second in a six-part series.*
```

---

## Track G — System Pages
### Requires: Phase 0 only.
### All four files are independent of each other.

---

### G.1 — app/not-found.tsx

**What it is:** The 404 page. Next.js App Router uses this file automatically for
unmatched routes. Styled consistently with the rest of the site.

**Imports:** next/link

**Exports:** Default NotFound component (Server Component, no 'use client')

**What to put in it:**

```typescript
import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      padding: '24px',
    }}>
      <p style={{
        fontSize: '10px', letterSpacing: '0.25em',
        color: '#444444', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono), monospace',
      }}>
        — 404 —
      </p>
      <h1 style={{
        fontSize: '36px', color: '#F2F2F2',
        fontFamily: 'var(--font-sans), sans-serif',
        fontWeight: 300, margin: 0,
      }}>
        Signal lost.
      </h1>
      <p style={{
        fontSize: '14px', color: '#888888',
        maxWidth: '320px', textAlign: 'center', lineHeight: 1.7, margin: 0,
        fontFamily: 'var(--font-sans), sans-serif',
      }}>
        This page doesn't exist. The spine doesn't reach here.
      </p>
      <Link href="/" style={{
        marginTop: '12px', padding: '10px 24px',
        border: '1px solid rgba(0, 255, 238, 0.25)',
        borderRadius: '4px', color: '#00FFEE',
        fontSize: '11px', fontFamily: 'var(--font-mono), monospace',
        textDecoration: 'none', letterSpacing: '0.12em',
      }}>
        ← return to surface
      </Link>
    </main>
  );
}
```

Font note: the CSS variables (--font-mono / --font-sans) are used instead of literal
family names because next/font registers fonts under hashed family names — a literal
"Space Mono" would silently fall back to the system font (R18). The root layout applies
the variables on <html>, so they are available here too.

---

### G.2 — app/sitemap.ts

**What it is:** Generates sitemap.xml at build time. Required for search engine indexing.
Next.js App Router serves this automatically at /sitemap.xml.

**Imports:**
- next (MetadataRoute)
- lib/blog.ts (getAllPosts)

**Exports:** Default sitemap function

**What to put in it:**

```typescript
import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

const BASE_URL = 'https://sidakpreet.in'; // Replace with real domain after setup

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogRoutes,
  ];
}
```

---

### G.3 — app/robots.ts

**What it is:** Generates robots.txt. Tells search engine crawlers to index everything.
Next.js App Router serves this automatically at /robots.txt.

**Imports:** next (MetadataRoute)

**Exports:** Default robots function

**What to put in it:**

```typescript
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://sidakpreet.in'; // Replace with real domain

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

---

### G.4 — app/opengraph-image.tsx

**What it is:** The social sharing preview image. Appears when your URL is shared on
LinkedIn, WhatsApp, iMessage, or any platform. Generated automatically at build time.
This is the single highest-ROI file for professional use — recruiters share URLs on
LinkedIn and this image is the first thing their network sees.

**Imports:** next/og (ImageResponse)

**Exports:** Default Image function plus runtime, alt, size, contentType exports.

**What to put in it:**

```typescript
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Sidakpreet Singh — Strategy & GTM';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        background: '#080808', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '72px',
        position: 'relative', fontFamily: 'system-ui',
      }}>
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '3px', height: '100%',
          background: 'rgba(0, 255, 238, 0.5)',
        }} />
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
        {/* Accent label */}
        <p style={{
          color: '#00FFEE', fontSize: '13px', letterSpacing: '0.22em',
          textTransform: 'uppercase', marginBottom: '20px', fontFamily: 'monospace',
        }}>
          STRATEGY · GTM · PRODUCT
        </p>
        {/* Name */}
        <h1 style={{
          color: '#F2F2F2', fontSize: '76px', fontWeight: 300,
          lineHeight: 1.05, margin: '0 0 24px 0',
        }}>
          Sidakpreet Singh
        </h1>
        {/* Role */}
        <p style={{ color: '#888888', fontSize: '24px', fontWeight: 400, margin: 0 }}>
          Manager · HCLSoftware · IIM Indore MBA
        </p>
        {/* Domain */}
        <p style={{
          position: 'absolute', bottom: '72px', right: '72px',
          color: '#333333', fontSize: '13px', fontFamily: 'monospace',
          letterSpacing: '0.12em',
        }}>
          sidakpreet.in
        </p>
      </div>
    ),
    { ...size }
  );
}
```

After deploy, verify the image at: https://opengraph.xyz — paste your URL to preview.

---

## Phase 3 — Integration
### SERIAL. Build these three files after all Phase 2 tracks are complete.
### Files here use the prefix "I" for Integration — a deliberate break from the Track
### A–G letter sequence, not a missing Track H.

---

### I.1 — components/providers/ScrollProvider.tsx

**What it is:** A thin client wrapper that initialises and destroys the Lenis scroll
system. Wraps the entire app inside app/layout.tsx.

**Imports:**
- react (useEffect)
- lib/scrollSystem.ts (initScrollSystem, destroyScrollSystem)

**Exports:** ScrollProvider (named export)

**What to put in it:**

```typescript
'use client';

import { useEffect } from 'react';
import { initScrollSystem, destroyScrollSystem } from '@/lib/scrollSystem';

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initScrollSystem();
    return () => destroyScrollSystem();
  }, []);

  return <>{children}</>;
}
```

---

### I.2 — app/layout.tsx

**What it is:** The root Next.js layout. Sets up fonts, metadata, analytics, viewport,
and wraps all pages with the ScrollProvider.

**Imports:**
- next (Metadata, Viewport)
- next/font/google (Space_Grotesk, Space_Mono)
- components/providers/ScrollProvider.tsx (ScrollProvider)
- @vercel/analytics/react (Analytics)
- styles/globals.css

**Exports:** Default layout component, metadata export, viewport export.

**What to put in it:**

```typescript
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import { ScrollProvider } from '@/components/providers/ScrollProvider';
import { Analytics } from '@vercel/analytics/react';
import '@/styles/globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sidakpreet.in'),
  title: {
    template: '%s · Sidakpreet Singh',
    default: 'Sidakpreet Singh · Strategy & GTM',
  },
  description:
    'Strategy and GTM professional. Manager at HCLSoftware. MBA from IIM Indore (top 2%). ' +
    'Building at the intersection of commercial strategy, product thinking, and analytical rigour.',
  keywords: [
    'strategy consulting', 'GTM strategy', 'product strategy', 'go-to-market',
    'IIM Indore', 'Sidakpreet Singh', 'HCLSoftware', 'business strategy',
  ],
  authors: [{ name: 'Sidakpreet Singh' }],
  openGraph: {
    type: 'website',
    url: 'https://sidakpreet.in',
    title: 'Sidakpreet Singh · Strategy & GTM',
    description: 'Strategy and GTM professional. Manager at HCLSoftware. MBA from IIM Indore.',
    siteName: 'Sidakpreet Singh',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sidakpreet Singh · Strategy & GTM',
    description: 'Strategy and GTM professional. Manager at HCLSoftware. MBA from IIM Indore.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body>
        <ScrollProvider>
          {children}
        </ScrollProvider>
        <Analytics />
      </body>
    </html>
  );
}
```

---

### I.3 — app/page.tsx

**What it is:** The main page. Assembles every component into the complete experience.
This is the last file written in the build.

**Imports:**
- next/dynamic
- lib/activeSections.ts (activeSections)
- lib/useMobile.ts (useMobile)
- config/world.ts (SECTION_HEIGHT_PX, HEADER_HEIGHT_PX, FOOTER_HEIGHT_PX)
- components/spine/SpineSVG.tsx (SpineSVG)
- components/cards/CardGrid.tsx (CardGrid)
- components/panels/PanelOverlay.tsx (PanelOverlay)
- components/ui/LoadingScreen.tsx (LoadingScreen)
- components/ui/NavDots.tsx (NavDots)
- components/ui/EmailIcon.tsx (EmailIcon)
- components/ui/DepthIndicator.tsx (DepthIndicator)
- components/ui/HeroSection.tsx (HeroSection)
- components/ui/FooterSection.tsx (FooterSection)

**What to put in it:**

Client component ('use client').

Dynamic import for WebGL canvas:
```typescript
const ExperienceCanvas = dynamic(
  () => import('@/components/canvas/ExperienceCanvas'),
  { ssr: false }
);
```

In the component:
```typescript
const isMobile = useMobile();

const totalHeight =
  HEADER_HEIGHT_PX +
  activeSections.length * SECTION_HEIGHT_PX +
  FOOTER_HEIGHT_PX;
```

Note: LoadingScreen now owns the isLoading lifecycle — do NOT call setIsLoading here.

Render structure:
```tsx
return (
  <>
    {/* Layer 0: WebGL Atmosphere (fixed, behind everything, desktop only) */}
    {!isMobile && <ExperienceCanvas />}

    {/* Layer 1: Scroll Container */}
    <div style={{ position: 'relative', height: totalHeight, zIndex: 1 }}>
      {/* Hero landing area */}
      <HeroSection />

      {/* SVG Spine (desktop only — SpineSVG itself handles nothing on mobile) */}
      {!isMobile && <SpineSVG totalHeight={totalHeight} />}

      {/* Cards */}
      <CardGrid />

      {/* Footer closing section */}
      <FooterSection />
    </div>

    {/* Layer 2: Fixed UI */}
    <NavDots />
    <EmailIcon />
    <DepthIndicator />

    {/* Layer 3: Panel Overlay */}
    <PanelOverlay />

    {/* Layer 4: Loading Screen */}
    <LoadingScreen />
  </>
);
```

---

## Phase 4 — Final Setup and Deploy

### Run these tasks in order after the build is complete.

**Task 1 — Test locally**

Run `npm run dev` and check:
- Boot sequence loads and all 4 lines animate
- Loading screen fades out after ~1.7 seconds
- Hero section (name, role, scroll prompt) animates in
- Scrolling moves the spine progress dot and anchor nodes light up
- Clicking a card opens the correct panel overlay
- About panel shows stat grid with 4 metrics
- Clicking outside or pressing Escape closes the panel
- Nav dots highlight the correct section
- Email icon opens a mail client
- Depth indicator shows correct zone
- Footer section visible at bottom with social links
- Blog route at /blog shows both starter posts
- Navigating to /anything-fake shows the 404 page

**Task 2 — Test mobile**

Open DevTools → toggle device toolbar → set width to 390px (iPhone 14) and check:
- Cards stack vertically, full width, readable
- Spine is hidden
- Nav dots are hidden
- Depth indicator is hidden
- Hero text is readable at mobile font size
- All panels open and scroll correctly on mobile

**Task 3 — Verify the toggle system**

In config/sections.ts, set any section's enabled to false. Save. That section's card
disappears, the spine recalculates, nav dots update. Set it back to true — everything returns.

**Task 4 — Verify motion preference**

In your OS settings, enable "Reduce Motion". Reload the page. Animations should not play —
elements appear instantly in their final position.

**Task 5 — Add real content**

Verify all JSON files contain real data and no placeholder text. Update the email address
in EmailIcon.tsx. Add more blog posts to content/blog/ as the LinkedIn series publishes.

**Task 6 — Push to GitHub**

```
git init
git add .
git commit -m "initial build: personal website"
git remote add origin https://github.com/ItsMonarch04/personal-website.git
git push -u origin main
```

**Task 7 — Deploy to Vercel**

Go to vercel.com. Connect GitHub account. Import the repository.
Vercel detects Next.js automatically. No configuration needed.
Every push to main auto-deploys.

**Task 8 — Add your domain**

In Vercel dashboard → Domains → Add your domain (sidakpreet.in or similar).
Follow the DNS instructions Vercel provides. DNS propagation takes up to 24 hours.

**Task 9 — Update BASE_URL**

After the domain is live, update BASE_URL in app/sitemap.ts and app/robots.ts, plus
metadataBase and openGraph.url in app/layout.tsx, to the real domain.
Redeploy: `git commit -am "update domain" && git push`.

**Task 10 — Verify social sharing**

Go to opengraph.xyz and paste your live URL. Confirm the OG image shows correctly.
Share your URL on LinkedIn in a test post. Confirm the preview card looks correct.

---

## Pre-Launch Checklist
### Run every item before considering the site live. Covers the build, the interactions,
### the content, the mobile experience, and the discovery layer.

### Build Quality
- [ ] `npm run build` completes with zero errors
- [ ] `npm run lint` returns zero warnings
- [ ] `npx tsc --noEmit` passes (TypeScript type check)

### Desktop — Core Experience
- [ ] Loading screen appears and all 4 boot lines animate in sequence
- [ ] Loading screen fades out cleanly after ~1.7 seconds
- [ ] Hero section (name, role, scroll prompt) appears with staggered animation
- [ ] Spine SVG renders at the correct height (not truncated)
- [ ] Spine base layer (dim) is visible
- [ ] Spine pulse animation (travelling cyan) plays on loop
- [ ] Spine progress (scroll fill) advances as you scroll
- [ ] Scroll dot moves along the spine path
- [ ] Spine anchor nodes appear at each section point
- [ ] All four section cards render at correct left/right positions
- [ ] Cards animate in (fade + rise) when scrolled into view
- [ ] Card borders brighten on hover
- [ ] CTA text ("Open →" / "Read →") changes colour on hover

### Desktop — Interactions
- [ ] Clicking About card opens About panel
- [ ] Clicking Portfolio card opens Portfolio panel
- [ ] Clicking Projects card opens Projects panel
- [ ] Clicking Blog card navigates to /blog (not a panel)
- [ ] Panel slides in from below and fades in (power2.out, 0.45s)
- [ ] About panel shows stat grid with 4 metrics
- [ ] About panel shows bio, skills, and stack
- [ ] Portfolio panel shows all 5 items with tags and years
- [ ] Projects panel shows all 4 items with status indicators
- [ ] Panel closes on X button click
- [ ] Panel closes on backdrop click
- [ ] Panel closes on Escape key
- [ ] Panel slide-out animation plays on close
- [ ] Panel content stays visible for the full close fade (no blank backdrop)
- [ ] Page behind the overlay does not scroll while a panel is open
- [ ] Panel content itself scrolls with the wheel (data-lenis-prevent works)
- [ ] Anchor node circles are visible at each card's inner edge (not hidden under cards)
- [ ] Nav dots appear on right side, one per section
- [ ] Nav dot for current scroll position is highlighted
- [ ] Tooltip appears on nav dot hover
- [ ] Clicking a nav dot scrolls to correct section
- [ ] Depth indicator shows correct zone text as you scroll
- [ ] Email icon is visible in bottom-right corner
- [ ] Email icon opens mail client on click
- [ ] Footer section visible at bottom of page
- [ ] Footer GitHub and LinkedIn links open in new tab

### Desktop — Section Toggle
- [ ] Set one section to `enabled: false` in config/sections.ts
- [ ] That card disappears from page
- [ ] That section disappears from nav dots
- [ ] Spine recalculates path through remaining sections
- [ ] Set it back to `enabled: true` — everything returns

### Mobile (test at 390px width — iPhone 14)
- [ ] Spine is hidden on mobile
- [ ] Nav dots are hidden on mobile
- [ ] Depth indicator is hidden on mobile
- [ ] WebGL canvas is disabled on mobile
- [ ] Cards stack vertically, full width, readable
- [ ] Card text does not overflow
- [ ] Hero section shows name and role at correct mobile font sizes
- [ ] All panels open and are scrollable on mobile
- [ ] Closing panels works on mobile (X button, backdrop tap)
- [ ] Email icon is visible and tappable on mobile
- [ ] No horizontal scroll at any viewport width

### Blog
- [ ] /blog loads and shows list of posts
- [ ] Post dates display correctly
- [ ] Post excerpts display correctly
- [ ] Clicking a post navigates to /blog/[slug]
- [ ] Full post content renders
- [ ] "← Writing" back link works
- [ ] Blog typography (font size, line height, spacing) is readable

### System Pages
- [ ] /sitemap.xml returns valid XML with all routes
- [ ] /robots.txt returns correct content
- [ ] Navigate to /anything-fake → 404 page appears with correct design
- [ ] 404 "return to surface" link works

### Content — No Placeholders
- [ ] About panel: no template text, every line is real
- [ ] Portfolio panel: all 5 real work items, no dummy data
- [ ] Projects panel: all 4 real projects, no template text
- [ ] Blog: at least 2 real posts published
- [ ] Blog post dates match the actual LinkedIn publish dates (currently set to May 2025 — verify)
- [ ] Email icon: real email address (not your.email@example.com)
- [ ] OG image: real name, correct domain

### SEO & Social Sharing
- [ ] Page title in browser tab: "Sidakpreet Singh · Strategy & GTM"
- [ ] Test OG preview at opengraph.xyz with your URL
- [ ] OG image shows correct name, role, and domain
- [ ] LinkedIn share preview shows OG image correctly
- [ ] WhatsApp link preview shows OG image correctly

### Performance
- [ ] Lighthouse Performance score ≥ 90 (desktop)
- [ ] Lighthouse Accessibility score ≥ 85
- [ ] First Contentful Paint < 2s on fast connection
- [ ] Enable "prefers-reduced-motion" in OS settings → animations stop

---

## Isolation Rules Summary

| This file/directory... | Can import from... | Must NEVER import from... |
|---|---|---|
| types/index.ts | nothing | everything |
| config/* | types/ only | store/, lib/, components/ |
| lib/activeSections.ts | config/, types/ | store/, components/ |
| lib/spinePathGenerator.ts | lib/activeSections, config/, types/ | store/, components/ |
| lib/cardPositioner.ts | lib/activeSections, config/, types/ | store/, components/ |
| lib/scrollSystem.ts | store/, lenis | components/, config/ |
| lib/motion.ts | nothing | everything |
| lib/useMobile.ts | react | everything else |
| store/ | types/, config/world.ts | components/, lib/ |
| components/spine/ | lib/, store/, config/ | components/cards/, components/panels/, components/canvas/ |
| components/cards/ | lib/, store/, config/ | components/spine/, components/panels/, components/canvas/ |
| components/panels/ (each panel) | content/*.json, types/ | store/, lib/, other panels, spine, cards, canvas |
| components/panels/PanelOverlay | store/, panels/index.ts, lib/motion.ts, lib/scrollSystem.ts | spine, cards, canvas |
| components/panels/index.ts | individual panel components | store/, lib/, spine, cards, canvas |
| components/canvas/ | store/, @react-three/* | spine, cards, panels, ui |
| components/ui/ | store/, lib/, config/ | spine, cards, panels, canvas |
| components/blog/ | types/ | store/, lib/, all other components |
| app/page.tsx | everything (assembler) | — |
| app/blog/* | lib/blog, components/blog/, next-mdx-remote | store, canvas, spine, cards, panels |
| app/sitemap.ts | lib/blog, next | components/, store/ |
| app/robots.ts | next | everything else |
| app/opengraph-image.tsx | next/og | everything else |

---

## Complete File Manifest
### Every file the project contains, in creation order.

```
personal-website/
│
├── types/
│   └── index.ts                          ← F0.1  · All shared TypeScript types
│
├── config/
│   ├── sections.ts                       ← F0.2  · Master section toggle file
│   ├── world.ts                          ← F0.3  · Layout geometry constants
│   └── theme.ts                          ← F0.4  · Colour constants for JS/WebGL
│
├── lib/
│   ├── activeSections.ts                 ← F0.5  · Filtered enabled sections
│   ├── scrollSystem.ts                   ← F0.7  · Lenis init + RAF scroll writing
│   ├── motion.ts                         ← F0.9  · prefers-reduced-motion utility
│   ├── useMobile.ts                      ← F0.10 · Mobile detection hook
│   ├── spinePathGenerator.ts             ← P1.A  · SVG path generator
│   ├── cardPositioner.ts                 ← P1.B  · Card y-positions
│   └── blog.ts                           ← F.1   · Blog post reader functions
│
├── store/
│   └── useSiteStore.ts                   ← F0.6  · Zustand global state
│
├── styles/
│   └── globals.css                       ← F0.8  · CSS vars, reset, keyframes, reduced-motion
│
├── content/
│   ├── about.json                        ← C.6   · About Me content (real data)
│   ├── portfolio.json                    ← C.7   · Portfolio items (real data)
│   ├── projects.json                     ← C.8   · Project items (real data)
│   └── blog/
│       ├── ai-substitution-myth.mdx      ← F.6   · Blog post 1
│       └── the-abundance-trap.mdx        ← F.7   · Blog post 2
│
├── components/
│   │
│   ├── providers/
│   │   └── ScrollProvider.tsx            ← I.1   · Lenis init wrapper
│   │
│   ├── spine/
│   │   └── SpineSVG.tsx                  ← A.1   · Full-page animated SVG spine + nodes
│   │
│   ├── cards/
│   │   ├── Card.tsx                      ← B.1   · Individual section card (mobile-aware)
│   │   └── CardGrid.tsx                  ← B.2   · Positions all cards (desktop + mobile)
│   │
│   ├── panels/
│   │   ├── PanelOverlay.tsx              ← C.0   · Shared panel wrapper + GSAP
│   │   ├── AboutPanel.tsx                ← C.1   · About Me content + stat grid
│   │   ├── PortfolioPanel.tsx            ← C.2   · Portfolio content
│   │   ├── ProjectsPanel.tsx             ← C.3   · Projects content
│   │   ├── PlaceholderPanel.tsx          ← C.4   · Coming soon placeholder
│   │   └── index.ts                      ← C.5   · Panel registry (id → component)
│   │
│   ├── canvas/
│   │   ├── ExperienceCanvas.tsx          ← D.1   · R3F Canvas (fixed, desktop only)
│   │   ├── Scene.tsx                     ← D.2   · Three.js scene root
│   │   └── SkyParticles.tsx              ← D.3   · Atmospheric particle drift
│   │
│   ├── ui/
│   │   ├── LoadingScreen.tsx             ← E.1   · Terminal boot sequence
│   │   ├── NavDots.tsx                   ← E.2   · Fixed right-side nav (desktop only)
│   │   ├── EmailIcon.tsx                 ← E.3   · Fixed bottom-right mailto link
│   │   ├── DepthIndicator.tsx            ← E.4   · Zone label bottom-left (desktop only)
│   │   ├── HeroSection.tsx               ← E.5   · Landing hero area
│   │   └── FooterSection.tsx             ← E.6   · Scroll end closing section
│   │
│   └── blog/
│       ├── PostHeader.tsx                ← F.4   · Post title, date, back link
│       └── PostBody.tsx                  ← F.5   · MDX typography wrapper
│
├── app/
│   ├── layout.tsx                        ← I.2   · Root layout, fonts, analytics
│   ├── page.tsx                          ← I.3   · Main experience page (assembler)
│   ├── not-found.tsx                     ← G.1   · 404 page
│   ├── sitemap.ts                        ← G.2   · Sitemap generation
│   ├── robots.ts                         ← G.3   · Robots.txt
│   ├── opengraph-image.tsx               ← G.4   · Social sharing OG image
│   └── blog/
│       ├── page.tsx                      ← F.2   · Blog index
│       └── [slug]/
│           └── page.tsx                  ← F.3   · Individual post
│
├── next.config.ts                        ← Setup · Minimal config
├── tailwind.config.ts                    ← Setup · Custom colours and fonts (v3, pinned)
├── postcss.config.mjs                    ← Setup · Tailwind v3 PostCSS wiring
├── tsconfig.json                         ← Auto-generated
├── package.json                          ← Auto-generated + dependencies
└── README.md                             ← Repository documentation
```

Total: 47 code/content files · 5 phases · 7 parallel tracks · 1 toggle system.

---

## Version Roadmap

### v0.1 — This Build
Core site live: hero, spine, cards, panels, blog, deploy, mobile-ready, SEO-complete.
Target: live in one week of focused execution.

### v0.2 — Atmosphere & Completeness
1. Full WebGL atmospheric system (Track D, if skipped for the initial launch)
2. Resume download button in About panel (PDF at /public/resume.pdf)
3. Scroll progress bar at top of viewport (2px fixed bar, accent colour, width = scrollT × 100%)
4. Contact form via Formspree replacing the email icon (no backend, free tier)
5. Per-post OG images (/blog/[slug]/opengraph-image.tsx)

### v0.3 — Depth
1. Case study pages (/work/[id]) — portfolio items link to full pages
2. Keyboard navigation — arrow keys cycle sections, K opens panel
3. "Currently working on" live micro-section in About panel
4. LinkedIn series archive page (/writing) for longer-form pieces

---

## Content Strategy

### Blog as LinkedIn Mirror

The 6-part LinkedIn series on AI and knowledge work maps directly to blog posts.
Publish on LinkedIn first. Archive to the blog one week later.

| LinkedIn Post | Blog Slug |
|---|---|
| Post 1: The AI Substitution Myth | ai-substitution-myth ✓ |
| Post 2: The Abundance Trap | the-abundance-trap ✓ |
| Posts 3–6 | Add as the series publishes |

The blog will never be empty. Two posts are live from day one.

### Update Cadence

- Portfolio: after each significant milestone (close, pipeline stage, new GTM motion)
- Projects: after each meaningful ship
- Blog: 1 post per month minimum — the LinkedIn series covers 6 months
- currentFocus in about.json: update immediately when job status changes

---

## Repository README
### No file code — written during Project Setup, not part of any numbered phase or track.

Create this file at the project root before the first GitHub push.

```markdown
# sidakpreet.in

Personal portfolio with an animated SVG spine, WebGL atmospheric effects,
GSAP-driven panel overlays, and an MDX blog system.

Live at [sidakpreet.in](https://sidakpreet.in)

## Stack

Next.js 15 · TypeScript · Tailwind CSS v3 · Three.js + React Three Fiber
GSAP · Lenis · Zustand · MDX (next-mdx-remote v5) · Vercel

## Updating Content (no code required)

**About Me:** Edit `content/about.json`
**Portfolio items:** Edit `content/portfolio.json`
**Projects:** Edit `content/projects.json`
**New blog post:** Create `content/blog/your-slug.mdx`:

---
title: "Post Title"
date: "2025-05-11"
excerpt: "One sentence description."
slug: "your-slug"
---

Post content here.

## Adding a Section

1. Create the panel in `components/panels/YourPanel.tsx`
2. Register it in `components/panels/index.ts`
3. Add the entry in `config/sections.ts` with `enabled: true`

The spine, nav dots, and scroll system update automatically.

## Disabling a Section

Set `enabled: false` for that section in `config/sections.ts`.
Set back to `true` to restore it.

## Local Development

npm install
npm run dev → http://localhost:3000

## Deploy

Every push to `main` auto-deploys via Vercel (~60 seconds).
```

---

*Master Build Plan · May 2025 · rev. 2 (May 2025): version pins for Next 15 / Tailwind
v3.4, Lenis panel-scroll fixes, close-fade fix, anchor/card geometry fix, font-variable
fixes, a11y semantics, metadataBase, dependency trim*
*47 files · 5 phases · 7 parallel tracks · 1 toggle system*
*Mobile-ready · SEO-complete · Accessibility-compliant · Social-sharing-ready*
