# Runbook — Error & performance monitoring

What signal exists today, where to read it, and what to do when it goes red.
This is a **static, local-first** site: no server runtime, no backend logs. The
monitoring surface is therefore the client, the build, and Vercel's edge.

---

## What's instrumented

| Signal               | Source                                                                                                  | Where to read it                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Build failures       | Vercel build (runs `prebuild`: content pull + `validate-content.mjs`, then `next build`)                | Vercel → Deployments → the failed build's logs                                |
| Content-shape errors | `scripts/validate-content.mjs` (prebuild gate)                                                          | Build log — the build fails before deploy                                     |
| Page views / traffic | `@vercel/analytics` (cookieless)                                                                        | Vercel → Analytics                                                            |
| **Field Web Vitals** | `lib/vitals.ts` — LCP, CLS, INP via `PerformanceObserver`, reported on page hide as `web_vital` events  | Vercel → Analytics → Events (`web_vital`, with `metric` / `value` / `rating`) |
| **Conversions**      | `lib/analytics.ts` `trackConversion` (`contact_email`, `resume_download`, `social_link`, `blog_uplink`) | Vercel → Analytics → Events                                                   |
| Runtime JS errors    | Browser console only (no external error tracker wired)                                                  | DevTools; not aggregated in the field                                         |

> Field Web Vitals are also a **control signal**, not just telemetry: a live
> poor reading (late LCP, accumulating CLS, janky INP) demotes the render tier
> through the same demote-only path the fps probe uses (`lib/quality.ts`
> `capQuality`). A rising `web_vital` `poor` rate therefore also means more
> visitors are being dropped to the lite/CSS visual — worth acting on.

---

## Triage

**Build is failing.**

1. Read the Vercel build log. An empty/invalid `SANITY_PROJECT_ID` fails the
   build _by design_ (the previous deploy stays live) — set the env and redeploy.
2. A `validate-content.mjs` failure means Sanity returned content that breaks a
   contract. Fix the document in Studio (or the committed `content/*.json`
   fallback), then rebuild. Do **not** weaken the validator to get green.
3. Never `npm audit fix --force` (proposes an unsafe Next downgrade).

**Web Vitals regressed (rising `poor` rate on LCP/CLS/INP).**

1. Confirm it's field-wide, not one device: check the `rating` split in Analytics.
2. LCP: look at the hero/above-fold — a heavy image or a blocking asset. Keep the
   [230 kB home-JS budget](./ENGINEERING-OPERATIONS.md#home-javascript-budget) honest.
3. CLS: something is shifting after paint — an async-loaded block without reserved
   space. The world heights are CSS-resolved for CLS≈0; a regression usually means
   new chrome broke that.
4. INP: a heavy handler on the main thread. Profile the interaction in DevTools.
5. Remember the tier auto-demotes under strain — a spike in `low`/`medium` quality
   corroborates a real regression.

**Visitors report a broken page but the build is green.**

1. Reproduce with DevTools open; capture the console error and the route.
2. If it's a content issue, see the rollback runbook (§2). If it's code, revert
   the offending change (rollback runbook §1) while you fix forward.

---

## Adding an external error tracker (future, owner call)

There is deliberately no Sentry/tracker wired: the runtime-dependency budget is
frozen and the site is local-first (no telemetry beyond the cookieless Vercel
Analytics the owner opted into). If field JS-error visibility becomes necessary:

- Prefer a `window.onerror` / `onunhandledrejection` hook that forwards a
  **scrubbed** message to a `track('client_error', …)` event — zero new deps,
  same cookieless destination, no PII. This is the local-first-consistent option.
- A full tracker (Sentry et al.) is a dependency-budget + privacy decision for
  the owner, and would need a line in `docs/PRIVACY.md`.
