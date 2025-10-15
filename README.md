# Sidakpreet Singh

Personal website with an animated SVG spine, WebGL atmospheric effects, GSAP-driven panel overlays, and an MDX blog system.

Public launch is pending a canonical-domain decision. The code currently uses
`https://sidakpreet.in` as a provisional canonical, but that host does not yet
resolve; `sidakpreetsingh.com` currently serves the older placeholder site, not
this Next.js build. Search indexing is disabled until launch (`robots` /
metadata `noindex`).

## Stack

Next.js 15 · TypeScript · Tailwind CSS v3 · Three.js + React Three Fiber · GSAP · Lenis · Zustand · MDX (next-mdx-remote v5) · Vercel

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

```bash
npm run lint
npm run build
```

## Updating Content

Content JSON and MDX under `content/` are the committed fallback. With Sanity
wired (`SANITY_PROJECT_ID`), `npm run content` / `prebuild` pull published
docs into those files.

- **About Me:** Edit `content/about.json` (or the About singleton in Studio).
- **Portfolio items:** Edit `content/portfolio.json`.
- **Projects:** Edit `content/projects.json`.
- **New blog post:** Create `content/blog/your-slug.mdx`:

```mdx
---
title: "Post Title"
date: "2025-05-25"
excerpt: "One sentence description."
slug: "your-slug"
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

## Deploy

The intended production path is GitHub `main` → Vercel. Before treating a push
as a public deployment, verify the Vercel integration and the custom-domain
assignment — the repository alone does not prove that platform state. Flip
indexing on only after the canonical domain serves this build.

## License

MIT © Sidakpreet Singh — see [LICENSE](LICENSE).

---

## AI Agent Instructions

Never commit or push unless the owner explicitly asks. Before any authorized
commit, use the owner-assigned release version and update the Version Control
string below with the real current commit time in IST (`Asia/Kolkata`). Align
that version in `package.json` and both root version fields in
`package-lock.json` in the same commit. Historical v0.8.9–v0.12.0 timestamps
were owner-directed exceptions; do not rewrite pushed history.

* **Base Format Version:** 0.12.5
* **Portfolio Version:** v0.12.5_2025-10-15_21:54:54 (IST)
