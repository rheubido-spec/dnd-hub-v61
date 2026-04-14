
# v32 diagnostics and optimization notes

## Findings
- Repeated hero/banner markup across Dashboard, Campaigns, and Character Sheet increased maintenance risk and caused prior JSX nesting errors during rapid edits.
- Frontend Docker build contexts were larger than necessary because `node_modules`, `dist`, and test artifacts were not excluded.
- Frontend Dockerfile used `npm install` instead of `npm ci`, which is slower and less reproducible when `package-lock.json` is present.

## Fixes applied
- Added a reusable `PageHero` component and migrated Dashboard, Campaigns, and Character Sheet to use it.
- Added `frontend/.dockerignore` and `backend/.dockerignore`.
- Switched frontend Dockerfile from `npm install` to `npm ci`.
- Standardized hero sizing and page wrapper spacing with `.page-shell` and `.page-hero` rules.

## Recommended next fixes
- Add lazy loading for large page banners (`loading="lazy"` where suitable outside top-of-page critical hero areas).
- Move static option sets into memoized selectors or server-loaded caches if the reference catalog grows significantly.
- Add pagination or virtualization if saved character/campaign lists become large.
- Run Playwright E2E in CI with a container-safe browser config and retain trace artifacts on failure.

- v39 added backend-saved map projects, DM/player export variants with fog-of-war style masking, and subclass support in the character builder.
