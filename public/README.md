# `public/`

Static assets served from the site root. Next.js maps `public/x` to `/x`.

This directory exists so that a root-served file has somewhere to land:

- **`resume.pdf`** — written here by `scripts/pull-content.mjs` when Sanity
  holds a résumé asset. It is intentionally not committed. `content/site.json`
  carries `resumeAvailable`, and every résumé CTA stays suppressed while that
  is `false`, so a missing file is a correct state rather than a broken link.
- **Domain-verification files** and any `robots.txt` / `site.webmanifest`
  override belong here too. `app/robots.ts` and `app/sitemap.ts` generate those
  two today; a file placed here would take precedence.
