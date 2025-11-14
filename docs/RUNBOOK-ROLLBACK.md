# Runbook — Rollback

How to take the live site back to a known-good state. There are three
independent things that can go wrong, and each rolls back separately: the
**deployment** (code/build), the **content** (Sanity), and the **DNS/domain**.
Start by deciding which one is broken — a bad deploy and bad content have
different fixes, and rolling back the wrong layer wastes time.

The stack: static Next.js export, hosted on **Vercel**, content pulled from
**Sanity** at build time (`scripts/pull-content.mjs` in `prebuild`), with the
committed `content/*.json` as the fallback/history. There is no server runtime
to restart — every "deploy" is an immutable static build.

---

## 1. Deployment rollback (bad code or bad build)

**Symptom:** the site is broken/regressed after a push or a rebuild, but the
content is fine.

**Fastest path — Instant Rollback (no rebuild):**

1. Vercel dashboard → the project → **Deployments**.
2. Find the last known-good production deployment (green, correct commit).
3. **⋯ → Promote to Production** (a.k.a. Instant Rollback). Vercel re-points the
   production alias at that existing build in seconds — nothing rebuilds.
4. Confirm the production URL serves the good build (hard-refresh; check the
   footer/version and a couple of pages).

**Durable path — revert the source:**

1. `git revert <bad-sha>` (or revert the merge) on `main`. Never force-push to
   erase pushed history.
2. Push. Vercel builds the revert and promotes it on success.
3. Bump the README version block per the versioning protocol in the same commit.

> The `prebuild` runs `pull-content.mjs` then `validate-content.mjs`. An empty
> `SANITY_PROJECT_ID` **fails the production build immediately** by design, so a
> misconfigured deploy never goes live — the previous deployment stays serving.
> That is a safety feature, not the incident: fix the env, don't bypass the gate.

**Do not** run `npm audit fix --force` as part of a rollback — it proposes an
unsafe Next downgrade.

---

## 2. Content rollback (bad copy/data from Sanity)

**Symptom:** the layout is fine but the text/links/data are wrong, usually right
after a Studio publish + deploy-hook rebuild.

Because content is **build-time static**, wrong content is baked into the live
build. Two ways back:

**A — fix in Sanity, then rebuild (preferred):**

1. Sanity Studio → the affected document → **History** → restore the previous
   revision (or re-publish the corrected fields).
2. Trigger a rebuild: the Studio publish fires the Vercel Deploy Hook
   automatically; if it didn't, hit the Deploy Hook URL (Vercel → Settings →
   Git → Deploy Hooks) or redeploy from the dashboard.
3. `prebuild` re-pulls the corrected content; confirm live.

**B — fall back to the committed content (Sanity down / can't wait):**

1. The `content/*.json` files are the committed fallback. If they already hold
   the good values, deploy with an **empty `SANITY_PROJECT_ID`** so the pull is
   skipped and the build uses the committed JSON.
2. If the committed JSON is also stale, `git revert` the offending
   `content/*.json` change (or edit it directly), push, and let Vercel rebuild.

---

## 3. Domain / DNS rollback

**Symptom:** the site is unreachable or the wrong project answers the domain.

1. Vercel → Project → **Settings → Domains**: confirm the custom domain is
   attached to _this_ project and points at the production deployment.
2. If DNS records were changed at the registrar, restore the previous A/CNAME
   records. DNS changes propagate on the record's TTL — plan for minutes to
   hours, and communicate that window.

---

## Verification checklist (after any rollback)

- [ ] Home page loads; the descent boot completes (or skips) cleanly.
- [ ] A blog post renders; RSS at `/feed.xml` responds.
- [ ] Contact channels resolve (email link, socials) — the conversion surfaces.
- [ ] No new console errors; Web Vitals look sane (see the error-monitoring runbook).
- [ ] README version block matches the deployed commit.
