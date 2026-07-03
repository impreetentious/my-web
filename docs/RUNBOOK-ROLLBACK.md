# Runbook — Rollback

The deployment, build-time Sanity content, and DNS are independent failure domains. Identify the affected layer before rolling anything back.

## Deployment rollback

Use Vercel's deployment history when a newly promoted build is broken but an earlier deployment is healthy:

1. Open the project in Vercel and select **Deployments**.
2. Find and inspect the last known-good production deployment.
3. Promote that deployment to production.
4. Hard-refresh the production URL and verify the home page, a dossier, a blog post, and both feeds.

The application does not own a long-running backend service, so there is no process to restart. Promoting an existing immutable deployment is the fastest recovery path.

## Content rollback

Sanity content is pulled during the build and baked into the generated pages. A content correction therefore requires a new build.

1. Restore or correct the affected published document in Sanity.
2. Trigger a Vercel rebuild.
3. Confirm that `prebuild` completed the Sanity pull and content validation.
4. Verify the corrected production page.

If Sanity is unavailable, remove `SANITY_PROJECT_ID` from that deployment and rebuild to use the reviewed, committed `content/` fallback. When the project ID is configured, fetch or validation errors intentionally fail the build.

## Domain and DNS recovery

1. In Vercel project settings, confirm that the custom domain is attached to the intended project and production deployment.
2. At the DNS provider, restore the last known-good records if they changed.
3. Allow for the records' TTL, then verify HTTPS, redirects, `robots.txt`, and `sitemap.xml` on the canonical host.

## Verification

- Home page loads and the intro completes or skips cleanly.
- Dossier deep links open and browser Back closes the overlay.
- A blog post renders; `/feed.xml` and `/feed.atom` respond with XML.
- Contact and social links point to their intended destinations.
- Browser console and Vercel build logs show no new errors.
