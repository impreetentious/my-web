# Sidakpreet Singh

Source for [sidakpreetsingh.com](https://sidakpreetsingh.com), a personal website built around a single animated descent. The home page combines an SVG navigation spine, WebGL atmosphere, scroll-driven dossier panels, and a progressively enhanced mobile layout. Writing is published as statically generated MDX pages with RSS and Atom feeds.

## Stack

Next.js 15 · TypeScript · Tailwind CSS v3 · Three.js + React Three Fiber · GSAP · Lenis · Zustand · MDX · Sanity · Vercel

## Local development

Use Node `22.22.x` (`.nvmrc` pins `22.22.2`). The repository enables npm's strict engine check.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Verification

The CI workflow runs the following release gates with Node 22.22.2:

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm run check:version
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
npm run build
npm run budget:bundle
npm run budget:performance
npm run budget:lighthouse
npm run test:e2e
node scripts/verify-placeholder-states.mjs
```

The Studio is a separate package and is checked independently:

```bash
npm ci --prefix studio
npm audit --prefix studio --omit=dev --audit-level=high
npm run typecheck --prefix studio
npm run build --prefix studio
```

Playwright and Lighthouse start the production server on port 3008. The bundle gate enforces a 230 KiB gzip first-load JavaScript limit on the home route and 250 KiB on other routes.

## Content

Committed JSON and MDX under `content/` are the build fallback. When `SANITY_PROJECT_ID` is unset, builds use those files unchanged. When it is set, `prebuild` pulls published Sanity documents into `content/` and validates them; a configured CMS fetch or validation failure stops the build rather than publishing stale content.

- Site identity and metadata: `content/site.json`
- About: `content/about.json`
- Portfolio: `content/portfolio.json`
- Projects: `content/projects.json`
- Series metadata: `content/series.json`
- Posts: `content/blog/*.mdx`

A post begins with YAML frontmatter:

```mdx
---
title: 'Post Title'
date: '2025-05-11'
excerpt: 'One sentence description.'
slug: 'post-title'
---

Post content goes here.
```

Run `npm run content:validate` after editing committed content.

### Sanity Studio

```bash
cd studio
cp .env.example .env
npm ci
npm run dev
```

Set `SANITY_STUDIO_PROJECT_ID` in `studio/.env`. The optional one-time seed command runs from the repository root and requires `SANITY_PROJECT_ID` plus an Editor-scoped `SANITY_WRITE_TOKEN`:

```bash
npm run content:seed
```

## Architecture

Sections are registered in `config/sections.ts`. Panel sections map to components in `components/panels/index.ts`; route sections provide an `href`. The filtered section list drives card positions, both spine variants, navigation, dossier routes, and total world height.

The visual-quality controller starts with a device-appropriate tier and only demotes after constrained-network, low-battery, poor frame-rate, context-loss, or poor field-vital signals. Reduced-motion users get native scrolling and demand-rendered or static effects. The home experience has no JavaScript-only content barrier: both the boot veil and card entrances fail open.

Sanity is build-time only. The deployed front end does not query the CMS at runtime.

## Search and feeds

Canonical metadata, JSON-LD, `robots.txt`, and `sitemap.xml` use the origin in `content/site.json`. RSS is available at `/feed.xml`; Atom is available at `/feed.atom`.

## Deployment

`.github/workflows/ci.yml` verifies pull requests and pushes to `main`. Production hosting is configured on Vercel. If a Sanity deploy hook is used, it should trigger a new Vercel build after published content changes.

See the [engineering budgets](docs/ENGINEERING-OPERATIONS.md),
[error-monitoring runbook](docs/RUNBOOK-ERROR-MONITORING.md),
[rollback runbook](docs/RUNBOOK-ROLLBACK.md), and
[privacy posture](docs/PRIVACY.md).

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/impreetentious/my-web). Open an issue before anything substantial, keep changes focused and leave the checks under [Verification](#verification) green.

## License

Apache-2.0 © 2025-2026 Sidakpreet Singh — see [LICENSE](LICENSE).

---

**Version:** v0.18.1
