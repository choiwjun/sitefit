# Hide Technical Disclaimer Copy

## Context
- Public report detail sections displayed long technical disclaimer copy:
  - Lighthouse-style / PageSpeed comparison note
  - PageSpeed or AI API dependency note
  - SiteFit rule based diagnosis explanation
- These are useful internally, but unnecessary for general users reading a sales-facing diagnosis report.

## Change
- Removed the public web-quality explanatory disclaimer from `public/app.js`.
- Removed the long trust-evidence note from public UI.
- Removed the trust-evidence note from shared report HTML.
- Replaced `SiteFit rules` UI label with the simpler `참고 지표` and `진단 기준`.

## Verification
- Added public UI regression coverage to ensure technical disclaimer phrases are not rendered from the public script.
- Added shared report route coverage to ensure generated report HTML does not expose Lighthouse/PageSpeed/API/rule copy.
- `npm.cmd test` passed with 113 tests.

