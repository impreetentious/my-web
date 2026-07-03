# Runbook — Error and performance monitoring

## Available signals

| Signal                    | Source                                              | Where to inspect                 |
| ------------------------- | --------------------------------------------------- | -------------------------------- |
| Build failures            | Vercel build, including content pull and validation | Vercel deployment logs           |
| Content-shape errors      | `scripts/validate-content.mjs`                      | Local or deployment build output |
| Page views                | `@vercel/analytics`                                 | Vercel Analytics                 |
| Field Web Vitals          | `lib/vitals.ts` reports LCP, CLS, and observed INP  | Vercel Analytics events          |
| Contact conversions       | Calls routed through `lib/analytics.ts`             | Vercel Analytics events          |
| Runtime JavaScript errors | Browser console only                                | Reproduction in browser DevTools |

Field Web Vitals also feed the visual-quality controller. A poor live measurement demotes the rendering tier, so a rise in poor vitals can correlate with more visitors receiving the lighter visual treatment.

## Triage

### Build failures

1. Read the deployment log and identify the first failing command.
2. A configured Sanity fetch or validation error is release-blocking. Correct the environment or published document and rebuild.
3. Reproduce code failures locally with the Node version in `.nvmrc` and the same gate command CI ran.

### Web Vitals regressions

1. Check whether the regression is isolated to a route or device class.
2. For LCP, inspect above-the-fold content, font loading, and blocking assets.
3. For CLS, look for late content without reserved geometry.
4. For INP, profile the interaction and its main-thread work.
5. Run the documented production [performance budgets](./ENGINEERING-OPERATIONS.md#performance-budgets) before deploying a fix.

### Broken pages with green builds

1. Reproduce the exact route with DevTools open and record the first console error.
2. Determine whether the bad value comes from generated content or application code.
3. Use the appropriate procedure in the [rollback runbook](./RUNBOOK-ROLLBACK.md), then fix forward.

There is currently no external client-error collector. Adding one changes the privacy and dependency posture and must be reflected in `docs/PRIVACY.md`.
