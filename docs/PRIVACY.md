# Privacy posture

The site is **local-first and low-telemetry by design**. This document is the
honest, complete account of what leaves a visitor's browser — kept current so
any claim on the site or in review can be checked against it.

## Principles

- No accounts, no login, no server-side session, no first-party cookies set by
  the app.
- No fingerprinting, no cross-site tracking, no ad/marketing pixels.
- No personal data is collected, stored, or transmitted by the app. The only
  "contact" surfaces are outbound links (`mailto:`, social profiles) the visitor
  chooses to follow — the site never holds an address book or a form submission.
- The only analytics is **Vercel Analytics**, which is cookieless and does not
  collect personally identifiable information.

## What is actually sent

| Data              | Mechanism                                                | Contains                                                                              | Destination                  |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| Page view         | `@vercel/analytics` (`<Analytics/>` in `app/layout.tsx`) | Route, referrer, coarse device/geo — cookieless, no PII                               | Vercel Analytics             |
| Conversion events | `lib/analytics.ts` `trackConversion`                     | An event name + low-cardinality props (a surface name, a platform) — see below        | Vercel Analytics (same pipe) |
| Field Web Vitals  | `lib/vitals.ts` → `trackVital`                           | `metric` (LCP/CLS/INP), a rounded `value`, a `rating` — no session id, no route trace | Vercel Analytics (same pipe) |

There is **no separate endpoint**. Everything routes through the single Vercel
Analytics pipeline the owner opted into; the code adds no new destination.

### Enumerated conversion events

Defined once in `lib/analytics.ts` (`ConversionEvent`), fired only when a
visitor activates a contact affordance:

- `contact_email` — an email affordance was clicked. Prop: `surface`
  (`fab` | `footer` | `contact_panel` | `about_panel`).
- `resume_download` — the résumé link was clicked. Prop: `surface`.
- `social_link` — a social relay was clicked. Props: `platform`, `surface`.
- `blog_uplink` — an end-of-post channel was clicked. Prop: `channel`.

None of these carry visitor-identifying data — only which affordance was used.

## What is NOT collected

- No IP address logging by the app; no cookies; no `localStorage` identity.
  (`sessionStorage` holds a single non-identifying `mw-booted` flag so the intro
  doesn't replay in-session, and `localStorage` may hold reading progress — both
  device-local, never transmitted.)
- No form data — there is no form.
- No error payloads are sent in the field today (see the error-monitoring
  runbook; any future addition must be scrubbed and added to this table first).

## Content & the CMS

Content is authored in **Sanity** and pulled at **build time**
(`scripts/pull-content.mjs`); the live site is static. Visitors never talk to
Sanity — there is no runtime CMS fetch from the browser.

## Turning analytics off

Remove `<Analytics/>` from `app/layout.tsx` (and, if desired, the `track` calls
route through `lib/analytics.ts`, so guarding or no-op'ing that one module
disables every conversion/vital event at once). No other privacy-relevant wiring
exists to unwind.

## Keeping this honest

Any change that sends new data — a new event, a new prop, an error tracker, a
third-party script — updates this file **in the same change**. If it isn't in the
table above, the site doesn't send it.
