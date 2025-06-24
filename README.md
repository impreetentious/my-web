# Sidakpreet Singh

Personal website with an animated SVG spine, WebGL atmospheric effects, GSAP-driven panel overlays, and an MDX blog system.

Soon live at sidakpreetsingh.com

## Stack

Next.js 15 · TypeScript · Tailwind CSS v3 · Three.js + React Three Fiber · GSAP · Lenis · Zustand · MDX (next-mdx-remote v5) · Vercel

## Updating Content

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


## Adding a Section

1. Create the panel in `components/panels/YourPanel.tsx`
2. Register it in `components/panels/index.ts`
3. Add the entry in `config/sections.ts` with `enabled: true`

The spine, nav dots, and scroll system update automatically.

## Disabling a Section

Set `enabled: false` for that section in `config/sections.ts`.
Set back to `true` to restore it.


## Deploy

Every push to `main` auto-deploys via Vercel (~60 seconds).

---

## AI Agent Instructions

Before making any new commits, update the Version Control string in this file with the current IST time of commit (`Asia/Kolkata`).
This IST timestamp rule is permanent for all future workflows, commits, and AI agents working in this repository.

* **Base Format Version:** 0.7.1
* **Portfolio Version:** v0.7.1_2025-06-25_02:14:23 (IST)
