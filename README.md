# Sidakpreet Singh

Personal website with an animated SVG spine, WebGL atmospheric effects, GSAP-driven panel overlays, and an MDX blog system.

The site is a single scrolling page composed of registered panels — about, portfolio, projects, writing, contact — tied together by a spine graphic, nav dots, and a scroll system that all read from one section config. The blog lives at its own routes and is authored in MDX. Content comes from Sanity when configured, and from committed JSON/MDX files otherwise.

## Stack

Next.js 15 · TypeScript · Tailwind CSS v3 · Three.js + React Three Fiber · GSAP · Lenis · Zustand · MDX (next-mdx-remote v6) · Vercel

## Run locally

Requires Node 22+.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Verify

```bash
npm run lint
npm run build
```

```bash
npm run build          # required once so the production server has .next
npm test               # placeholder both-states + pull fallback + Playwright (port 3008)
```

`npm test` builds and drives the real production server, so run `npm run build` first.

## Updating Content

Content JSON and MDX under `content/` are the committed fallback and are always what ships when Sanity is not configured. With `SANITY_PROJECT_ID` set, `npm run content` — and `prebuild`, which runs automatically before every build — pulls published documents into those same files, then validates them. An unset project ID is not an error; the build simply uses the committed content.

- **About Me:** Edit `content/about.json` (or the About singleton in Studio).
- **Portfolio items:** Edit `content/portfolio.json`.
- **Projects:** Edit `content/projects.json`.
- **New blog post:** Create `content/blog/your-slug.mdx`:

```mdx
---
title: 'Post Title'
date: '2025-05-11'
excerpt: 'One sentence description.'
slug: 'your-slug'
---

Post content goes here.
```

### Sanity Studio (separate package)

```bash
cd studio
cp .env.example .env   # set SANITY_STUDIO_PROJECT_ID
npm install
npm run dev            # local studio
npm run deploy         # → <name>.sanity.studio
```

One-time seed from the repo root (needs a write token — never commit it):

```bash
# .env.local: SANITY_PROJECT_ID + SANITY_WRITE_TOKEN
npm run content:seed
npm run content
```

## Adding a Section

1. Create the panel in `components/panels/YourPanel.tsx`
2. Register it in `components/panels/index.ts`
3. Add the entry in `config/sections.ts` with `enabled: true`

The spine, nav dots, and scroll system update automatically.

## Disabling a Section

Set `enabled: false` for that section in `config/sections.ts`.
Set back to `true` to restore it.

## Rendering and performance

The WebGL layer picks a quality tier by probing the device, then only ever demotes it: a `navigator.connection` Save-Data or slow-effective-type signal, a low battery reading, or poor live Web Vitals each lower the tier. The first-visit boot sequence is skippable with Esc, Space, Enter, or a visible Skip control.

## Search indexing

Indexing is off by default — pages ship with `noindex` metadata. The canonical URL is configured in the site metadata and must point at the host that actually serves this build before indexing is enabled.

## Deploy

The production path is GitHub `main` → Vercel. `prebuild` pulls and validates content, so a deploy with `SANITY_PROJECT_ID` set publishes the current CMS state; without it, the committed `content/` files ship.

Operational notes live in `docs/`: `RUNBOOK-ROLLBACK.md`, `RUNBOOK-ERROR-MONITORING.md`, and `PRIVACY.md`.

## License

MIT © Sidakpreet Singh — see [LICENSE](LICENSE).

---

**Version:** v0.14.4
