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

---

## Version Control

* **Base Format Version:** 0.2.0
* **Portfolio Version:** v0.2.0_2025-06-16_00:40:43 (IST)
