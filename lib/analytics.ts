import { track } from '@vercel/analytics';

// The single tracking surface for the site. Everything routes through the
// Vercel Analytics `track` already wired in app/layout.tsx — the same
// cookieless, PII-free destination the owner opted into. No new endpoint, no
// device fingerprint, nothing stored client-side. Two event families:
//
//   • conversions — the handful of actions that mean a visitor is trying to
//     reach me (email, résumé, a social relay). Named once here so no stray
//     event strings drift across components (docs/PRIVACY.md enumerates them).
//   • field vitals — real-user LCP / CLS / INP, reported on page hide.
//
// A failed beacon must never break an interaction, so every call is guarded.

export type ConversionEvent =
  | 'contact_email'
  | 'resume_download'
  | 'social_link'
  | 'blog_uplink';

/** Allowed by Vercel Analytics (`AllowedPropertyValues`). */
type EventProps = Record<string, string | number | boolean | null>;

/** Record a conversion. `props` stays low-cardinality (a surface name, a
 *  platform) — never anything that could identify a visitor. */
export function trackConversion(event: ConversionEvent, props?: EventProps): void {
  try {
    track(event, props);
  } catch {
    // analytics is best-effort — a blocked or absent beacon is silent
  }
}

export type VitalName = 'LCP' | 'CLS' | 'INP';
export type VitalRating = 'good' | 'needs-improvement' | 'poor';

/** Report one Core Web Vital. CLS is unitless, so it is scaled ×1000 to an
 *  integer bucket; LCP/INP are milliseconds. Value + rating only — no route
 *  timing trace, no session id. */
export function trackVital(metric: VitalName, value: number, rating: VitalRating): void {
  try {
    track('web_vital', {
      metric,
      value: Math.round(metric === 'CLS' ? value * 1000 : value),
      rating,
    });
  } catch {
    // best-effort — see trackConversion
  }
}
