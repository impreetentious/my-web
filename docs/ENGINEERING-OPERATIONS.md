# Engineering operations

## Release discipline

Commits use real timestamps. Reverts preserve published history: use `git revert`
for a bad production change and do not force-push or rewrite a shared branch.
Every release-version change keeps the README version block, `package.json`, and
the package-lock root in sync.

## Home JavaScript budget

The home route's First Load JavaScript budget is 230 kB. Treat an increase as a
performance regression: measure the production build, identify the imported
route code, and either remove the cost or record and enforce a revised budget
before release.
