# Privacy posture

The site is low-telemetry by design. This document describes the analytics
enabled by the application and the data stored in the browser.

## Principles

- No accounts, no login, no server-side session, no first-party cookies set by
  the app.
- No fingerprinting, no cross-site tracking, no ad/marketing pixels.
- The application has no contact form or user database. Contact surfaces are
  outbound links (`mailto:` and social profiles) that the visitor chooses to follow.
- The only analytics is **Vercel Web Analytics**, which uses no tracking
  cookies and stores anonymized, aggregated data.

## What analytics records

`<Analytics/>` in `app/layout.tsx` records page views. Vercel documents that a
data point may include the timestamp, URL and route, filtered query parameters,
referrer, coarse geolocation, operating system, browser, and device class.
Vercel derives a daily visitor hash from the incoming request; it does not use
a tracking cookie or associate the data point with an individual or IP address.
See Vercel's [Privacy and Compliance](https://vercel.com/docs/analytics/privacy-policy)
documentation for the service-level details.

The application also sends two kinds of custom event through the same service:

| Data             | Mechanism                            | Custom properties                                            |
| ---------------- | ------------------------------------ | ------------------------------------------------------------ |
| Conversion event | `lib/analytics.ts` `trackConversion` | Event name plus a surface name and, where relevant, platform |
| Field Web Vital  | `lib/vitals.ts` → `trackVital`       | `metric` (LCP/CLS/INP), rounded `value`, and `rating`        |

There is **no separate endpoint**. Everything routes through the single Vercel
Analytics pipeline; the application adds no other telemetry destination.

### Enumerated conversion events

Defined once in `lib/analytics.ts` (`ConversionEvent`), fired only when a
visitor activates a contact affordance:

- `contact_email` — an email affordance was clicked. Prop: `surface`
  (`fab` | `footer` | `contact_panel` | `about_panel`).
- `resume_download` — the résumé link was clicked. Prop: `surface`.
- `social_link` — a social relay was clicked. Props: `platform`, `surface`.
- `blog_uplink` — an end-of-post channel was clicked. Prop: `channel`.

The routes contain no user identifiers, and the custom properties above contain
no free-form visitor input.

## What is NOT collected

- No IP address logging by application code, no first-party cookies, and no `localStorage`.
  `sessionStorage` holds two non-identifying, device-local flags so the intro and
  one visual effect do not replay during the same tab session.
- No form data — there is no form.
- No error payloads are sent in the field today (see the error-monitoring
  runbook; any future addition must be scrubbed and added to this table first).

## Content & the CMS

Content is authored in **Sanity** and pulled at **build time**
(`scripts/pull-content.mjs`); the live site is static. Visitors never talk to
Sanity — there is no runtime CMS fetch from the browser.

## Turning analytics off

Remove `<Analytics/>` from `app/layout.tsx`, remove the `@vercel/analytics`
dependency, and remove or disable the calls in `lib/analytics.ts`. No other
analytics integration exists in the application.

## Keeping this document current

Document any new event property, endpoint, error tracker, or third-party script
here when it is introduced.
