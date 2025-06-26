# REVAMP BRIEF — "The Descent: DECOUPLE & DEEPEN" (updated 2025-06-26)

This file is THE living record of this revamp: scope, status, decisions,
rejections. Update it when a workstream's status changes; never delete
history — supersede it.

**Where things stand (2025-06-26):** Workstreams A–C are BUILT, VERIFIED
(§14 protocol run 2025-06-25: tsc/eslint clean, prod build 190 kB First
Load JS on `/`, desktop journey + plunge replay + dossier focus discipline
+ mobile 320/375/430 + reduced-motion + tier-drop/restore + prod smoke on
3008 all pass) and **COMMITTED as v0.8.0–v0.8.5**; this brief + plan
finalization is committed as **v0.8.5**. On 2025-06-26 it was
PUSHED to both remotes (`origin` = GitHub, `gitlab` =
GitLab — see §16). Workstream D (launch gate) is POSTPONED: a 2025-06-26
owner review found the site's data layer half-decoupled and the journey one
section short. Workstreams **E → F → G (→ H optional)** now run BEFORE D.
Do not rebuild A–C. Contested calls and rejections live in §15 — do not
relitigate without new evidence.

**Bar (unchanged):** activetheory.net material quality. **North star
(unchanged):** a common idea taken uncommon purely through execution depth.
The descent IS the site.

**The organizing fiction (unchanged):** visitor = probe. Loading = signal
acquisition. Hero = contact. Comet = the probe. Cards = intercepted
transmissions. Panels = decoded dossiers. Footer = end of transmission +
mission recap. Every string, number and animation belongs to this fiction.

---

## 0. Ground rules (non-negotiable, carried forward)

- **NO commits, NO pushes unless the owner explicitly asks.** When he does:
  message format `Commit vX.Y.Z: <desc>` single line, no body, NO AI
  attribution ever; bump README's Version Control block (Portfolio Version +
  Base Format Version, fresh IST timestamp) AND `package.json` version in
  the same commit (aligned at 0.8.5 — do not let them drift).
- Repo `~/Documents/Git/my-web`. Stack pins: Next 15, Tailwind 3.4
  (not 4), React 19, R3F 9 / three 0.176, GSAP + CustomEase, Lenis, Zustand.
  Plus (C9): Instrument Serif via next/font as `--font-display`.
- Preview: repo-level `.claude/launch.json` (untracked) resolves for this
  workspace — `personal-website-dev` (3007) and `personal-website-prod`
  (3008; `npm start -p 3008`). The session-root
  `~/Documents/Git/.claude/launch.json` configs (`my-web-dev`/`my-web-prod`)
  exist but the repo-level file wins when starting from the repo. NEVER 3000.
- Perf budget: Lighthouse ≥95 perf on prod build; `/` First Load JS ≤230 kB
  (190 kB at post-C build — all of Workstream C cost ~9 kB). New deps only
  if they earn their bytes; audio IS procedural Web Audio (zero assets).
  Workstream G adds ZERO runtime deps to the Next app.
- Keep: a11y (focus trap, aria, `:focus-visible` house style, skip-link,
  ≥24px targets), `prefers-reduced-motion` paths (real: native scroll, no
  plunge shock, no idle beats, no cursor ring, no abyss beat), SEO/metadata,
  mobile parity (same world below 767px, landmark milestone trio, gutter
  wake, full-width transmission cards).

### Dev gotchas (hard-won — reread before touching the tree)

1. **GSAP percent transforms:** inline `transform: translateY(112%)` parses
   into gsap's PIXEL `y` channel. Tween the same channel with percent
   strings (`y: '112%' → '0%'`), never `yPercent`, or reveals silently stick.
2. **Scroll normalisation:** every scroll-t consumer normalises against
   `getScrollLimit()` in lib/scrollSystem. Never raw `scrollY/(scrollHeight−vh)`:
   late-injected overlays pad the body past the scrollable extent. (Driving
   scroll in tests with the raw extent lands ~0.02 deeper than intended —
   fine for smoke, wrong for pinned-beat checks.)
3. **Turbopack HMR:** full-reloads randomly; Fast Refresh does NOT re-run
   `[]`-dep effects → scroll-subscription components keep stale closures.
   **Hard-reload before judging visuals.** `location.reload()` can
   scroll-restore to the pre-reload position even after
   `history.scrollRestoration='manual'` — for a guaranteed top-boot use a
   fresh navigation (`location.href='/?x'`), not reload.
4. **Build:** `npm run build` while ANY dev server runs (or a dev server
   started after a build) clobbers `.next` → prod `next start` throws
   `routesManifest.dataRoutes is not iterable`. Stop servers, build, start.
5. **Preview testing:** nav-rail clicks target section anchors, which all
   sit ABOVE the crossing — to drive a live plunge use a wheel-event burst
   (~22×150px at 16 ms) from ~0.06 t above CROSS_T; instant `scrollTo`
   crossings fire the plunge with near-zero velocity → no visible buoyancy.
   Preview console buffer persists across reloads (watch entry COUNT).
6. sessionStorage keys: `mw-booted` gates the boot theatre; `mw-abyss-beat`
   gates the once-per-session abyss passage (C10). Clear both to replay.
7. **Quality tiers:** `useSiteStore.quality` is `high | medium | low`. High
   = full shader, medium = dpr-1 lite (mobile default), low = animated CSS
   world (BackgroundGradient), canvas parked `display:none`. Verified: lose
   WebGL context → low; restore → probed tier. Anything visual must degrade
   across all three (the abyss beat and buoyancy simply don't exist at low).
8. **Audio autoplay:** the AudioContext is built lazily on the first toggle
   click (the gesture). Never auto-enable from a stored preference — the
   context would be created suspended. Mute is the default every visit.
9. **Scroll-t literals do NOT follow CROSS_T automatically.** The GLSL in
   `SkyOcean.tsx` and the voice mixes in `lib/audio.ts` carry literal
   scroll-t gates tuned to the CROSS_T=0.76 four-card world. Workstream F2
   re-expresses them parametrically; until F2 is DONE, changing the
   section count desynchronises shader/audio beats from the world.

---

## 1. Workstream status board (update on every status change)

| Stream | Scope | Status |
|---|---|---|
| A/B (mobile revamp, audits) | — | SHIPPED (≤ v0.8.0) |
| C (UI Rev v2: plunge, dossiers, transmissions, audio) | §2 map | SHIPPED, committed v0.8.0–v0.8.5 |
| **E — one source of truth** | §6 | **NOT STARTED — next up** |
| **F — six-stage journey (Contact + parametric world)** | §7 | NOT STARTED (needs E) |
| **G — Sanity backend (rebuild-on-publish)** | §8 | NOT STARTED (needs F; owner creates project) |
| H — scroll-reveal polish | §9 | OPTIONAL, LAST, skippable |
| D — launch gate L1–L8 | §10 | BLOCKED until E–G land |

Commits: E=v0.8.6, F=v0.8.7, G=v0.8.8, H=v0.8.9 (if built), D=v0.9.0.
(v0.8.5 = this brief + plan finalization, already committed.)
Strict order E→F→G: the Contact panel consumes site.json (E), and Sanity
schemas mirror the FINAL content shape (F) so there is no schema churn.

## 2. Current state (post-C, committed) — 30-second map

descent.ts single source, journey.ts per-frame runtime, scrollSystem
physics + reduced-motion path, quality tiers, one-DOM-both-breakpoints
layout, dossier panels with B5 focus discipline, one-take boot. From C:

- `lib/journey.ts` — buoyancy spring (C2): `plungeKickVh` captured from
  velocity in `firePlunge`, analytic damped sine `buoyancyVh(plungeElapsed)`
  (ζ=0.34, ω=7.2). Consumers: SkyOcean (world sampling + waterline offset),
  SpineSVG + MobileSpine (comet target + warm/cool flip). Verified e2e:
  overshoot peaks +2.7 vh at ~175 ms, one ~30% rebound, settled by ~1.4 s.
- `SkyOcean.tsx` — C13 second long swell modulating line displacement +
  specular glint clustering; persistent submerged refraction at ~10% of the
  plunge wobble; C10 abyss silhouette (uBeast uniform, 13 s pass above the
  probe inside the halo rim, underside rim-light, once per session).
- `DepthIndicator.tsx` — C3 `RATE ±n M/S | KM/S` line (velocity through the
  altitude/depth model derivative, units flip at CROSS_T, decays with
  velocity) + plunge warning burst (`WARNING: PRESSURE SPIKE` →
  `SIGNAL REACQUIRED +360MS`) + C11 audio gauge toggle `AUDIO [░░░░] OFF`.
- `lib/audio.ts` — C11 procedural engine: hum/warmth/wind/sub voices mixed
  by world position, velocity-modulated wind, sparse sonar + echo in the
  deep, plunge thump, decode tick on panel open. Master 0.16.
  **OPEN: owner ear-check — "excellent or absent" is his call** (§2a).
- `Card.tsx` + `.tx-*` in globals — C1 transmissions: notched plate,
  corner brackets, spine-facing port, RX header (mission clock + SNR from
  depth at decode: 12.4 dB → 5.2 dB), signal ticks, display-serif titles,
  decode scanline entrance, ≤2.2° tilt + world-lit sheen (gold above the
  line, teal from the probe's side below). Accent = trailColorAt(section u).
- `dossier.tsx` — C4 `DossierFigure` (seeded schematic artifacts: network/
  bars/stack/flow/orbit/pulse + FIG serials), C5 `CaseFile` (declassified
  extract: context/decision/move/model/outcome + redacted artefact whose one
  legible line is the real outcome metric), `PullQuote` (display-serif
  italic). Row extras render OUTSIDE the link (no nested interactives).
- `AboutPanel` — pull-quote, margin annotations (`bioNotes`), C6 CHANNELS
  block (proposition/availability/location + `EXTRACT FULL RECORD →`
  `/resume.pdf` + `OPEN CHANNEL →` mailto). PanelOverlay rail carries
  FULL RECORD/OPEN CHANNEL for the About dossier only. FooterSection
  carries the same path above the social row (moves to Contact in F1).
- Blog (C8) — transmission-log index (`LOG date · ENTRY nn · n MIN ·
  PART x/6`), `SERIES` registry in lib/blog.ts (`second-order`, planned 6;
  moves to content in E4), series page `/blog/series/[series]` with
  TRANSMISSION PENDING slots, reading time, related-next (series-aware),
  film-grain data-URI overlay, article OG metadata per post. Both MDX
  posts carry series frontmatter.
- C9 — Instrument Serif (`--font-display`) on: hero name, panel titles,
  ghost numerals, card titles, blog titles, stat values, 404. Body/mono stay.
- C12 — hero name specular sweep (glyph-accurate bg-clip overlay) on the
  ignition beat. C14 — cursor ring (lerp-follow, tightens on interactives,
  sonar blip underwater, fine-pointer + motion-allowed only, home only).
- C15 — EmailIcon transmit mark (dish + arcs + departing packet), NavDots →
  altitude rail (hairline track, tick marks, gold active, hover shows label
  + real altitude reading), OG image = golden-hour crossing world render
  (satori CSS only), 404 grain + drifting mote.
- C7 was already done at v0.7.2 (href-gated arrows + PRIVATE label).

Store/types: `FigureKind`, `CaseStudy`, `BlogPost.{readingTime,entry,
series,seriesIndex}` added. tsc + eslint clean; prod build clean; `/`
First Load JS 190 kB.

## 2a. C-residue (small, owner-gated — not blocking E/F/G)

- **Audio ear-check (C11):** engine verified functionally; SOUND quality
  needs the owner's ears on real speakers/headphones. If not clearly
  excellent: ship silent (delete the toggle render in DepthIndicator +
  lib/audio.ts import — one small diff; engine can stay in-tree dormant).
- **`public/resume.pdf` is NOT in the repo** — the C6 links 404 until the
  owner drops the file in. G3 closes this permanently (resume becomes a
  Sanity asset, pulled at build).
- **Case-study narratives (C5)** drafted from existing portfolio.json facts
  — owner to approve/edit wording in content/portfolio.json `caseStudy`
  (post-G: in Sanity Studio).
- **Tilt taste veto (C1):** ≤2.2° with slow ease-back; if it ever reads
  Apple-TV-card, delete the mousemove tilt block in Card.tsx and keep sheen.
- **Series naming (C8):** id `second-order`, title "The Second-Order
  Effects of AI" derived from post 1's own copy — owner may rename in
  the series content (lib/blog.ts today; content/series.json post-E4).

---

## 3. Audit verdict (2025-06-25) — what is actually broken

Read before coding. Less is broken than feared; the gaps are real:

**Already correct (do NOT rebuild):**
- Section toggles EXIST: `config/sections.ts` has `enabled: boolean` per
  section; `lib/activeSections.ts` filters, and page height, card slots,
  spine anchors, nav rail, ghost numerals, skip-link all derive from the
  filtered list. The disabled `placeholder` entry proves it end-to-end.
- Content JSON EXISTS: `content/about.json`, `portfolio.json`,
  `projects.json`, blog as MDX in `content/blog/`. Panels read them.
- Card entrance animation EXISTS (C1 decode, IntersectionObserver-gated).
  The "sections appear on scroll" ask is partly built; what's missing is
  scroll-LINKED motion (Workstream H, cosmetic, last).

**Actually broken (the work of E/F/G):**
1. Personal data hardcoded in components, duplicating/bypassing the JSON:
   name ×3, role line, email ×4, LinkedIn/GitHub URLs, site metadata,
   OG-image text, sitemap/robots domain, blog SERIES registry in code.
2. Content lives in the repo, so every career/content change = code edit +
   deploy. No backend.
3. No Contact section in the journey — contact is footer chrome only.
4. Section count is baked into the WORLD TUNING: `CROSS_T = 0.76` and ~30
   downstream literals (descent.ts, world.ts, the GLSL in SkyOcean.tsx,
   audio.ts, MobileSpine.tsx) assume the current 4-card page. Adding
   sections without retuning lands the plunge ON a card.
5. Item-level visibility doesn't exist (can't hide one portfolio row).
6. `public/resume.pdf` still missing — links 404 today (§2a).

## 4. Decisions locked with the owner (2025-06-25)

- **Backend: Sanity, rebuild-on-publish.** Content edited in Sanity Studio
  (free plan — owner already uses Sanity). Publishing fires a webhook →
  Vercel rebuild → live in ~2 min. The site stays 100% static: a
  dependency-free build script pulls Sanity content INTO the existing
  `content/*` files. Committed content files remain as fallback + history.
- **Journey: 6 stages + 1 dormant.** Home (hero — the subtle 10-second
  glance) → About → Portfolio → Blog → Projects → Contact (new, deepest).
  The `placeholder` section stays in config, `enabled: false`; flipping one
  boolean must produce a correct page in BOTH states. This forces the world
  tuning to become parametric (F2).
- **Contact: links only, no form.** Themed on-fiction as "OPEN CHANNEL"
  (F1); all copy comes from content so the owner can re-word later
  without code.

## 5. Architecture rules (the two boundaries — recite before every phase)

**Rule A — Structure in code, words in content.**
- In CODE (never in CMS): section list/order/enabled/type/side
  (`config/sections.ts`), world geometry (`config/world.ts`), fiction
  chrome strings (SIGNAL RECEIVED, TRANSMISSION nn, DECODE, telemetry
  labels), animation values.
- In CONTENT (`content/*` — after G, mastered in Sanity): every fact about
  the owner — name, role line, bio, stats, skills, items, case studies,
  posts, series, email, socials, availability, location, proposition,
  resume, domain, meta description/keywords.
- Litmus test: "would a recruiter read this string as being ABOUT the
  owner?" → content. "Is it part of the probe fiction or layout?" → code.

**Rule B — One source per fact.** The owner's email currently exists in 4
places. After Workstream E every personal fact exists in exactly ONE
content file; components import it.
`grep -rn "sps.daemon\|Sidakpreet\|linkedin.com\|github.com/ItsMonarch" app components lib`
must return ZERO hits (only `content/` may match).

---

## 6. WORKSTREAM E — One source of truth (no visual change) → v0.8.6

Goal: kill every hardcode. The page must render pixel-identical before/after.

### E1 — `content/site.json` (new file) + type

Create `content/site.json` — the identity document:

```json
{
  "name": "Sidakpreet Singh",
  "heroRoleLine": "Strategy & GTM · HCLSoftware · IIM Indore",
  "email": "sps.daemon@gmail.com",
  "socials": {
    "linkedin": "https://www.linkedin.com/in/sidakpreet-singh/",
    "github": "https://github.com/ItsMonarch04"
  },
  "domain": "https://sidakpreet.in",
  "metaTitle": "Sidakpreet Singh · Strategy & GTM",
  "metaDescription": "<current description string from app/layout.tsx>",
  "keywords": ["<current keywords array from app/layout.tsx>"],
  "proposition": "Strategy / GTM / Product Strategy",
  "availability": "OPEN TO OPPORTUNITIES · 2026",
  "location": "NEW DELHI · RELOCATION OPEN",
  "resumeHref": "/resume.pdf"
}
```

- Add `export interface SiteContent { … }` to `types/index.ts` mirroring the
  shape exactly (socials as `Record<'linkedin'|'github', string>` is fine).
- MOVE the channel facts out of `content/about.json`: delete its `channels`
  object; `proposition/availability/location/resumeHref/email` now live ONLY
  in site.json. `name` moves out of about.json too — it lives in site.json
  only. about.json keeps: headline, tagline, bio, bioNotes, pullQuote,
  pullQuoteRef, currentFocus, stats, skills, stack.

### E2 — Consumer refactor table (mechanical; import site.json, delete literals)

| File | What changes |
|---|---|
| `components/ui/HeroSection.tsx` | `Sidakpreet Singh` (appears TWICE — h1 and the C12 sweep overlay span; both must read the same `site.name`), role line → `site.heroRoleLine`. |
| `components/ui/FooterSection.tsx` | LinkedIn/GitHub hrefs → `site.socials.*`; both mailtos → `site.email`; the C6 channel block reads `site.proposition/availability/location/resumeHref` (this block MOVES in F1 — do the import now so F1 is a cut/paste). Replace `aboutData.channels.*` refs. |
| `components/ui/EmailIcon.tsx` | mailto → `site.email`. |
| `components/panels/AboutPanel.tsx` | Lede uses `site.name`; Channels block reads site.json fields instead of `aboutData.channels`. |
| `components/panels/PanelOverlay.tsx` | About-rail FULL RECORD/OPEN CHANNEL links → site.json fields (drop the `aboutData` import). |
| `app/layout.tsx` | Build the `metadata` object from `import site from '@/content/site.json'`: metadataBase `new URL(site.domain)`, titles/description/keywords/authors/openGraph/twitter from site fields. Static analysis is fine with imported JSON. |
| `app/opengraph-image.tsx` | `alt` + any rendered name/role text → site.json imports. |
| `app/sitemap.ts` | `BASE_URL` → `site.domain` (delete the "Replace with real domain" TODO — the domain now has one home; L1 remains the decision of WHICH domain). |
| `app/robots.ts` | Same domain source. |
| `app/blog/[slug]/page.tsx` + `app/blog/page.tsx` | Any author-name/site-name literals in metadata → site.json. |

### E3 — Item-level toggles

- Add `enabled?: boolean` to `PortfolioItem` and `ProjectItem` in
  `types/index.ts` (comment: "false hides the row; missing = shown").
- In `PortfolioPanel.tsx` and `ProjectsPanel.tsx` filter once at the top:
  `const items = (data as X[]).filter((i) => i.enabled !== false);`
- Record counters (e.g. "05 RECORDS") already derive from `items.length` —
  verify they count the FILTERED list.

### E4 — Blog series registry → content

- Create `content/series.json`:
  `{ "second-order": { "title": …, "planned": 6, "description": … } }`
  (copy the object literal out of `lib/blog.ts` SERIES).
- `lib/blog.ts` imports it (`import SERIES_DATA from '@/content/series.json'`)
  and keeps exporting `SERIES` with the same type so
  `app/blog/series/[series]/page.tsx` and consumers don't change.

### E5 — Auto-alternating card sides

`side` is fixed per section today; with a toggleable placeholder, any fixed
assignment puts two adjacent cards on the same side in one of the two
states. Fix: make `side` OPTIONAL in `SectionConfig`; in
`lib/activeSections.ts` derive it on the filtered list:
`side: section.side ?? (index % 2 === 0 ? 'left' : 'right')`.
Then REMOVE explicit `side` from all entries in `config/sections.ts`
(keep the field available for future pinning). `ActiveSection.side` stays
required — consumers (`CardGrid`, `Card`, `MobileSpine`,
`spinePathGenerator`) are untouched.

### E-verification (§14-lite)
1. `npx tsc --noEmit` + `npx eslint .` clean.
2. Grep audit (Rule B) returns zero component/app/lib hits.
3. Hard-reload dev (gotcha 3): screenshots at t≈0 / 0.5 / 0.76 / 1.0 —
   pixel-identical to pre-E.
4. Open all four dossiers; footer links; blog index + one post render.

---

## 7. WORKSTREAM F — Six-stage journey (Contact + placeholder + parametric world) → v0.8.7

### F1 — Contact section ("OPEN CHANNEL")

**Config** — `config/sections.ts` final order: about, portfolio, blog,
projects, placeholder, contact (contact LAST — it must be the deepest;
placeholder stays ABOVE it):

```ts
{ id: 'placeholder', enabled: false, label: 'TBD', type: 'panel',
  tagline: 'Transmission pending.' },
{ id: 'contact', enabled: true, label: 'Contact', type: 'panel',
  tagline: 'Establish an uplink. All channels monitored.' },
```

**Panel** — new `components/panels/ContactPanel.tsx`, registered in
`components/panels/index.ts` as `contact: ContactPanel`. Reuse the dossier
kit (`DossierBlock`, `DossierHead`, `ChipRow`…) — NO new visual language.
Content (all from site.json):
- Lede: `site.proposition` in the 19px sans voice (mirrors AboutPanel lede).
- `DossierHead: Status` → `site.availability · site.location` in mono.
- `DossierHead: Channels` → the two `ChannelLink`-style CTAs from
  AboutPanel (extract `ChannelLink` into `components/panels/dossier.tsx` so
  both panels share it): `OPEN CHANNEL →` (mailto `site.email`) and
  `EXTRACT FULL RECORD` (`site.resumeHref`, download).
- `DossierHead: Relay stations` → LinkedIn + GitHub as dossier rows/links
  (`site.socials`), `target="_blank" rel="noopener noreferrer"`,
  arrow affordance, ≥24px targets.
- One mono footnote line, fiction voice, e.g.
  `RESPONSE LATENCY: < 24H · ALL FREQUENCIES MONITORED` (code string —
  fiction chrome per Rule A).

**Footer slim-down** — `FooterSection.tsx`: DELETE the C6 channel block
(proposition/availability/location + the two links); the Contact dossier
owns that now. Footer keeps: seafloor SVG, motes, recap counters, social
row (from site.json), sonar end tag. The About rail + EmailIcon fab keep
the recruiter path ≤10s (§12.2 still satisfied).

### F2 — Parametric world tuning (the load-bearing change)

Today `CROSS_T = 0.76` is hand-tuned to the 4-card page. Make it DERIVED so
both placeholder states (5 or 6 cards) work.

In `lib/descent.ts` (imports `lib/activeSections` + `config/world` — no
import cycle: activeSections imports only config/*):

```ts
import { activeSections, totalPageHeight } from '@/lib/activeSections';
import { SECTION_HEIGHT_PX, HEADER_HEIGHT_PX } from '@/config/world';

/** Viewport height the tuning is normalised to. Real viewports (700–1100px)
 *  drift the card/crossing alignment ±0.02 t — same slop as today. */
const NOMINAL_VH = 900;

const N = activeSections.length;
const limit = totalPageHeight - NOMINAL_VH;
/** scroll-t at which card i sits screen-centred (nominal viewport). */
const tCard = (i: number) =>
  (HEADER_HEIGHT_PX + i * SECTION_HEIGHT_PX + SECTION_HEIGHT_PX / 2 - NOMINAL_VH / 2) / limit;

/** The crossing lands in the gap between the last two cards: everything
 *  above the waterline except the final (contact) transmission. */
export const CROSS_T = Math.min(0.88, (tCard(N - 2) + tCard(N - 1)) / 2);

/** Page-depth of the surface = viewport-centre depth at the crossing. */
export const U_SURFACE = (CROSS_T * limit + NOMINAL_VH / 2) / totalPageHeight;

/** Sky-stretch factor: early-journey beats scale with the longer sky. */
const K = CROSS_T / 0.76;
```

Sanity-check values (must match within ±0.005 — compute, don't trust):
- N=5 (placeholder off): totalPageHeight 5600, CROSS_T ≈ 0.840, U_SURFACE ≈ 0.785.
- N=6 (placeholder on): totalPageHeight 6500, CROSS_T ≈ 0.866, U_SURFACE ≈ 0.816.

**Rewrite rule for every scroll-t literal in the tuning files** (current
design centre 0.76):
- Edge within 0.12 of 0.76 (crossing-anchored) → `CROSS_T + δ` where
  δ = literal − 0.76.
- Edge < 0.64 (early-sky) → `K * literal`.
- Edge ≥ 0.93 (bottom-anchored: 0.97, 0.985, 0.98, 1.0) → unchanged.
- Literals compared against page-depth **u** (not t) → `U_SURFACE + δ`
  where δ = literal − 0.715. READ the surrounding code to classify t vs u.

Apply to (complete list — line numbers as committed at v0.8.5):
1. `lib/descent.ts`: `SEA_T0 = CROSS_T − 0.025`, `DEPTH_T0 = CROSS_T + 0.005`;
   `WATERLINE = { enterT: CROSS_T − 0.16, exitT: CROSS_T + 0.08 }`;
   `waterlineCurve` xs → `CROSS_T + [−0.26, −0.16, −0.115, −0.08, −0.04,
   −0.015, 0, +0.02, +0.04, +0.08]` (ys unchanged); `zoneWeights` — space
   `(K·0.30, K·0.55)`, dusk `(K·0.28, K·0.52)` / `(CROSS_T−0.08, CROSS_T+0.02)`,
   sea `(CROSS_T−0.06, CROSS_T+0.02)` / `(CROSS_T+0.09, 0.97)`, abyss
   `(CROSS_T+0.08, 0.97)`, rays `(CROSS_T, CROSS_T+0.08)` / `(CROSS_T+0.12, 0.985)`,
   stars `(K·0.55, K·0.70)`, underwater `(CROSS_T−0.02, CROSS_T+0.06)`;
   `abyssGate (CROSS_T+0.08, CROSS_T+0.17)`; `cometScreenVh` rise start
   `0.28 → K·0.28`; `cometScreenVhMobile` knot `0.52 → CROSS_T−0.24`, knot
   `0.3 → K·0.3`; MILESTONES: SEA LEVEL `t: CROSS_T − 0.012`, ABYSSAL PLAIN
   `0.985` unchanged (others already derive via `tAtAltitudeKm`/`tAtDepthM`).
2. `config/world.ts` `ZONE_THRESHOLDS`: horizon `CROSS_T − 0.26`, sea
   `CROSS_T − 0.04`, underwater `CROSS_T + 0.04`. (world.ts must NOT import
   descent.ts — move ZONE_THRESHOLDS into `lib/descent.ts` and update its
   consumers; check imports with grep first.)
3. `components/canvas/SkyOcean.tsx` — the GLSL has literal gates. Add TWO
   uniforms: `uCross` (set from CROSS_T) and `uSurfaceU` (set from
   U_SURFACE) beside the existing uniforms. Then per literal, classify by
   the variable being compared: `uScroll` comparisons → `uCross + δ`;
   world/page-depth (`wt`-style) comparisons → `uSurfaceU + δ`. Known sites
   at v0.8.5 ≈ lines 88 (wt: 0.66, 0.80 → uSurfaceU−0.055, +0.085), 131
   (0.78, 0.86), 146 (0.78, 0.98-keep), 147 (0.50, 0.66 → K-scale via
   precomputed floats or a third uniform; 0.80, 0.86 → uCross+δ), 208
   (0.70, 0.76 / 0.84, 0.92), 234 (0.80, 0.95), 236 (0.775, 0.82). GREP the
   whole shader for `0.7`/`0.8` before starting; miss nothing.
4. `lib/audio.ts` — voice mix gates (≈ lines 155–157: space 0.5, 0.75;
   golden 0.45, 0.62, 0.72, 0.8; under 0.74, 0.82) plus any deep/sonar
   gates further down: same rewrite rule, plain TS (`import { CROSS_T }`).
5. `components/spine/MobileSpine.tsx` ≈ line 222: `smoothstep(0.7, 0.85, t)`
   → `(CROSS_T − 0.06, CROSS_T + 0.09)`.

**Do NOT touch:** buoyancy spring constants (ζ, ω, plungeKickVh), quality
tiers, Lenis config, boot sequence, `getScrollLimit` normalisation
(gotcha 2), the C12 sweep, dossier machinery.

### F3 — Verification (run §14 TWICE: placeholder off AND on)

1. tsc + eslint clean; both toggle states build.
2. Desktop: crossing lands in the GAP between Projects and Contact cards
   (drive a live plunge per gotcha 5); no card overlaps the waterline band
   at 1440×900 and 1280×800.
3. Projects card accent flips to amber/gold (it is now ABOVE the surface —
   expected, derived from `trailColorAt(u)`); Contact card is teal/submerged.
4. DepthIndicator: ALT counts to SEA LEVEL, flips to DEPTH at the plunge;
   RATE line still sane; milestones pass at their captions (SEA LEVEL gold
   caption rides the crossing).
5. Mobile 320/375/430: six (and seven) slots, no overlap/h-scroll, gutter
   wake flip warm→cool at the on-screen waterline.
6. Reduced-motion traverse; quality low tier (BackgroundGradient world) —
   its CSS gradient stops are u-based: check `styles/globals.css` for any
   waterline percentage tied to the old world and re-anchor to U_SURFACE
   (grep globals.css for gradient stops near 70%).
7. Contact dossier: open → focus trap → Esc → restore; links work
   (mailto, socials open new tab, resume 404s until owner drops the file —
   known §2a item, closed by G).
8. Prod build (stop dev servers first — gotcha 4), smoke on 3008,
   First Load JS ≤ 230 kB.

---

## 8. WORKSTREAM G — Sanity backend (rebuild-on-publish) → v0.8.8

Site stays static; Sanity is the editing surface. NO runtime dependency,
NO new npm deps in the Next app.

### G1 — Studio (separate, not embedded)

- `studio/` directory at repo root with its OWN `package.json`
  (`npm create sanity@latest` scaffolding lives here; Next app untouched).
- Owner action: create the Sanity project (free plan; verify current free
  limits at sanity.io/pricing at signup — quotas as of early 2025: ~20
  users, 2 datasets, generous API/bandwidth, fine for a portfolio), dataset
  `production`, **public** (read without token — the content is a public
  website).
- Deploy the studio with `npx sanity deploy` → `<name>.sanity.studio`
  (free hosting; owner logs in with their Sanity account). No /studio
  route in the Next app — zero bundle impact.

### G2 — Schemas (mirror the content files EXACTLY — field names identical)

- `site` (singleton): every field of site.json + `resume` (file asset).
- `about` (singleton): headline, tagline, bio[], bioNotes[], pullQuote,
  pullQuoteRef, currentFocus, stats[]{value,label}, skills[], stack[].
- `portfolioItem`: id (slug), enabled (boolean, default true), order
  (number), title, year, description, tags[], href (url, optional),
  figure (enum: network|bars|stack|flow|orbit|pulse), caseStudy
  {context,decision,move,model,outcome} (optional object).
- `projectItem`: id (slug), enabled, order, title, description, stack[],
  href (optional), status (enum live|wip|archived), figure (enum).
- `post`: title, slug, date, excerpt, body (markdown — plain text field or
  `sanity-plugin-markdown` for a nicer editor), series (reference,
  optional), seriesIndex (number, optional).
- `series`: key (slug, e.g. `second-order`), title, planned, description.

### G3 — Pull script (the whole integration, ~150 lines, ZERO deps)

`scripts/pull-content.mjs`, plain Node fetch against the public Content
API (`https://<projectId>.apicdn.sanity.io/v2024-01-01/data/query/production?query=<GROQ>`):

- Fetch all six document types (published only — the public API never
  returns drafts, which gives a free draft workflow).
- **Validate everything, then write everything** (atomic): required fields
  present, enums legal, ≥1 post, site.email matches `.+@.+`. Any failure →
  print a loud warning, write NOTHING, `exit 0` (build proceeds on the
  committed fallback files).
- Writes (stable field order, 2-space indent, trailing newline — so
  `git diff` stays meaningful):
  - `content/site.json`, `content/about.json` (owner-facing fields only),
  - `content/portfolio.json`, `content/projects.json` (sorted by `order`;
    keep `enabled: false` items — the panels filter),
  - `content/series.json`,
  - `content/blog/<slug>.mdx` — frontmatter (title, slug, date, excerpt,
    series, seriesIndex) + body verbatim; DELETE local .mdx files whose
    slug no longer exists in Sanity,
  - `public/resume.pdf` — downloaded from the `site.resume` asset URL when
    present (career change = upload new PDF in Studio, done).
- `package.json`: `"content": "node scripts/pull-content.mjs"`,
  `"prebuild": "node scripts/pull-content.mjs"`. Env:
  `SANITY_PROJECT_ID` (+ optional `SANITY_DATASET`, default `production`)
  in `.env.local` and Vercel project env. **Unset env → script prints
  "SANITY_PROJECT_ID not set — using committed content" and exits 0** (dev
  and CI keep working with the repo files; MDX build errors from a bad post
  fail the DEPLOY build only — the previous deploy stays live on Vercel).

### G4 — One-time seed

`scripts/seed-sanity.mjs`: reads the current content files and POSTs
mutations to
`https://<projectId>.api.sanity.io/v2024-01-01/data/mutate/production`
with `SANITY_WRITE_TOKEN` from `.env.local` (never committed, never in
Vercel). `createOrReplace` with stable `_id`s (`site`, `about`,
`portfolio-<id>`, `project-<id>`, `post-<slug>`, `series-<key>`) so re-runs
are idempotent. After seeding: run `npm run content`; `git diff` must show
only whitespace/ordering-stable noise (ideally nothing).

### G5 — Publish → live pipeline

- Vercel: create a Deploy Hook (Project → Settings → Git → Deploy Hooks).
- Sanity Manage → API → Webhooks: POST that URL on create/update/delete
  (published documents only).
- Flow: edit in Studio → Publish → webhook → Vercel builds (prebuild pulls
  fresh content) → live. Periodically run `npm run content` locally and
  commit, so the repo snapshot (= fallback + history) stays fresh.

### G-verification
1. Seed → pull → `git diff` clean (see G4).
2. Delete one word in Studio, publish → deploy hook fires → change is live;
   confirm the committed file did NOT need to change.
3. Unset `SANITY_PROJECT_ID` locally → build still succeeds on fallback.
4. Toggle a portfolio item's `enabled` in Studio → row disappears after
   rebuild. Upload resume → `/resume.pdf` resolves (closes the §2a 404).
5. Full §14 pass + First Load JS unchanged (nothing shipped to the client).

---

## 9. WORKSTREAM H — Scroll-linked reveal polish (LAST, cosmetic, skippable) → v0.8.9

Cards already decode on viewport entry (C1). Add depth, don't replace:
- Per-card parallax drift: in `Card.tsx`'s existing scroll subscription
  pattern (see HeroSection's per-frame style writes), translate the card's
  INNER content wrapper by `clamp(±14px)` proportional to
  `(scrollT − tCard(section.index))`. NEVER transform `.card-slot` (its
  `translateY(-50%)` centring — same trap as the Card.tsx comment) and
  never the tilt-owning element (`.tx-card` transform belongs to the tilt).
  Add a dedicated inner div.
- Gate: `motionAllowed()` && quality !== 'low' && desktop only first pass.
- Milestones/spine already move — do not double-animate them.
- Budget: zero new deps, ≤1 day, delete-on-taste-veto like the tilt (§2a).

## 10. WORKSTREAM D — Launch checklist (pre-deploy gate) — runs LAST → v0.9.0

- **L1 — Canonical domain decision (BLOCKER):** README says `.com`-family,
  metadata/sitemap/robots say `sidakpreet.in`. Owner decides ONE host; set
  it in `content/site.json` `domain` (post-E the single source), strip TODOs.
- **L2 —** JSON-LD Person schema on `/` (build from `content/site.json`:
  name, url, sameAs from socials, jobTitle from proposition); `article`
  schema + dates on posts. (Posts already emit OG `article` metadata —
  L2 is the JSON-LD.)
- **L3 —** `theme-color: #05060D` (+ apple-mobile-web-app-status-bar); real
  favicon set (currently Next default) + apple-touch-icon from the
  comet/waterline mark.
- **L4 —** Verify blog post dates vs LinkedIn republication plan (owner) and
  post `excerpt`/OG per entry.
- **L5 —** Full §14 protocol incl. Lighthouse ≥95 on prod (3008),
  reduced-motion e2e keyboard-only traverse, fresh-boot capture, idle
  beats, live plunge at speed — repeated at launch config.
- **L6 —** Playwright smoke suite (small): mobile 375 no-overlap/no-h-scroll,
  panel open→focus→Esc→restore, reduced-motion basics, `/`+`/blog`+post+404
  render, plunge event fires crossing CROSS_T. NEW: contact dossier
  open/close, BOTH placeholder states build, pull-script fallback path
  (env unset). Dev-dep only; `npm test`.
- **L7 —** OG image route: decide `runtime` intentionally (edge today; the
  scene is satori-safe either way).

## 11. Version arc

v0.8.0–v0.8.5 = Workstream C (committed 2025-06-25/26). **v0.8.5 = this brief
+ plan finalization** (committed 2025-06-26, pushed
to both remotes). Then **v0.8.6 = E** → **v0.8.7 = F** → **v0.8.8 = G** →
(optional v0.8.9 = H) → **v0.9.0 = D (launch gate, deploy, domain live)**.
Each commit bumps README Version Control block + package.json together (§0).

## 12. Acceptance criteria (whole round) — status

1. Uncommonness: plunge + buoyancy bounce + abyss payoff + transmission
   cards/dossier system live on desktop; phone carries the same world.
   BUILT — owner's eye is the final gate.
2. Recruiter test: proposition/proof/résumé/contact reachable within 10 s
   from hero (About rail + EmailIcon + Contact dossier + footer socials).
   Post-F: the Contact transmission is the canonical path.
3. Perf: First Load JS 190/230 kB ✓ (must hold through E–G; G adds zero
   client bytes); Lighthouse ≥95 confirmed at L5.
4. Content decoupling: owner can change any personal fact, item, post or
   resume from Sanity Studio alone — no code edit, live in ~2 min (G).
5. Toggle test: `placeholder` flipped true/false produces a correct world
   in both states (F); any portfolio/project row hideable via `enabled`.
6. Owner preference test — his call at review.

## 13. Owner actions (parallel, non-code)

- Create the Sanity project + dataset (G1); provide the projectId.
- Upload resume PDF in Studio once G lands (kills the §2a 404).
- Canonical domain decision (L1) — still the launch blocker.
- Approve contact card tagline + panel wording after F1.
- Carried from §2a: audio ear-check verdict (keep or silent), case-study
  wording approval, URLs-or-private verdicts for LIVE project rows
  (Health Ledger / Local AI Stack / This Website).
- Blog series title/plan confirmation (rename in content/series.json
  post-E, in Studio post-G).

## 14. Verification protocol — unchanged

`npx tsc --noEmit` + eslint clean → hard-reload (gotcha 3) → desktop
screenshots at t ≈ 0 / 0.3 / 0.6 / CROSS_T / 0.9 / 1.0 → plunge replay
(wheel burst per gotcha 5) → dossier open/close (focus → close, Esc
restores) → mobile 320 + 375 + 430 → reduced-motion pass → quality-tier
drop pass → console/network clean → stop servers, `npm run build`, prod
smoke on 3008 → Lighthouse when the phase claims perf.

## 15. Rejected / deferred (carried; do not relitigate silently)

- **@react-three/postprocessing selective bloom by default:** glow lives
  in-shader; bloom only as a measured experiment behind the tier system.
- **Full-screen refraction of DOM content:** perf/complexity trap;
  world-only refraction shipped as C13.
- **Mouse-mapped LAT/LNG telemetry:** fake data cheapens real numbers;
  velocity/pressure readouts shipped instead (C3).
- **Migrating cards into WebGL:** a11y/SEO/selection cost; DOM restyle
  delivered it (C1).
- **FOV/zoom velocity stretch:** stays deferred — C2 shipped without it;
  reopen only if the bounce ever needs MORE physicality on device.
- **Lenis `syncTouch` on mobile:** do not reintroduce without on-device
  before/after (iOS Safari + Android Chrome).
- **Generic floating "Download CV" button:** C6 exists on-fiction only.
- **Audio preference persistence / auto-restore:** rejected (gotcha 9) —
  autoplay policy + mute-default principle.
- **Swapping the concept for editorial/minimal:** permanently rejected.

New (2025-06-26, Workstreams E–G):

- **Runtime ISR / live Sanity fetch:** rejected for launch — server-
  component refactor + runtime API dependency for a site that changes
  weekly. Rebuild-on-publish delivers the same outcome statically.
- **Embedded Studio route in the Next app:** dependency weight + React 19
  friction; separate `studio/` + sanity.studio hosting instead.
- **Portable Text for posts:** PostBody/next-mdx-remote pipeline stays;
  posts are markdown strings in Sanity.
- **Moving sections/geometry into the CMS:** structure is code (Rule A);
  a mis-published CMS doc must never be able to break world geometry.
- **Global scroll-warp to avoid retuning (remapping scrollT):** scrollT
  feeds px↔t conversions (NavDots, milestones, spine); warping it corrupts
  geometry. The parametric CROSS_T (F2) is the correct fix.
- **Contact form + form service:** owner chose links-only; revisit
  post-launch if ever needed.
- **Git-based CMS (Keystatic/Decap):** owner chose Sanity (familiar,
  independent editing surface); revisit only if Sanity's free tier turns
  hostile.

---

## 16. Repository & workflow notes (read before any git operation)

**Remotes (reconfigured 2025-06-26):**
- `origin` → GitHub (`github.com/ItsMonarch04/my-web`) — the DEFAULT. A bare
  `git push` / `git pull` targets GitHub; `main` tracks `origin/main`.
- `gitlab` → GitLab (`gitlab.com/ItsMonarch04/my-web`) — secondary mirror.
  Push there explicitly with `git push gitlab main`.
- (Before 2025-06-26 the names were swapped: `origin`=GitLab,
  `github`=GitHub. They were renamed so GitHub is the default.)
- Keep BOTH remotes in sync when publishing history: push `origin` then
  `gitlab`. Vercel deploys from GitHub (`origin`).

**Brief tracking:** `REVAMP_BRIEF.md` was removed from `.gitignore` on
2025-06-26 and is now a tracked, committed, pushed file (v0.8.5) — it IS the
shipped record for this phase. "for now" per the owner: if the site ever
goes fully public and the brief shouldn't ship, re-add it to `.gitignore`
and `git rm --cached` it. It has no effect on the built site or bundle.

**Commit discipline reminder (see §0):** `Commit vX.Y.Z: <desc>`, single
line, no AI attribution; bump README Version Control block (fresh IST
timestamp) + `package.json` in the SAME commit; never commit or push unless
the owner asks.

---
