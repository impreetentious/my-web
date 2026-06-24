# Dependency Notes

- `whatwg-encoding@3.1.1` and `tsconfck@3.1.6` are deprecated at their latest published releases. They are removable only when upstream packages stop depending on them; an override cannot make a non-deprecated release exist.
- Sanity 6 removes those two deprecated packages from this tree.
- Adding an `overrides` block to an already-resolved dependency tree may leave the lockfile unchanged. If an override does not take effect, perform a full re-resolve rather than relying on `npm install --package-lock-only`.
