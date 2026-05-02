# Admin Token Production Guard

## Context
- Admin, sales operations, demo cleanup, and export APIs are intentionally open during local development when `ADMIN_TOKEN` is empty.
- In production, the same empty-token behavior can expose operational APIs and weaken sales/demo data controls.

## Decision
- Keep local development behavior unchanged.
- When `nodeEnv` is `production` and `adminToken` is empty:
  - protected admin/sales APIs return `401` with `admin_token_required`
  - `/api/session` returns `503` with `admin_token_required`
  - health checks remain public
  - public report links remain accessible only with the run share token

## Verification
- Added server tests for:
  - production protected API denial with an empty admin token
  - production session endpoint failure with an empty admin token
  - health endpoint staying available
  - report share-token links still working in production without admin auth configured
- `npm.cmd run test -- test/server.test.js` passed with 23 tests.

