# Hide Public Price Ranges

## Context
- Public diagnosis reports displayed package price ranges such as `800,000-2,500,000원`.
- This can shift prospects into price comparison before the consultation clarifies scope, urgency, and implementation depth.

## Decision
- Keep package recommendations visible in public/shared reports.
- Hide package price ranges in public/shared reports.
- Replace the displayed amount with `상담에서 범위 확정`.
- Preserve internal estimate pricing data and admin estimate display.

## Verification
- Added public UI regression coverage to ensure `public/app.js` does not reference `priceRange` or `formatPriceRange`.
- Added shared report route coverage to ensure rendered HTML does not expose numeric price ranges and shows `상담에서 범위 확정`.
- `npm.cmd test` passed with 111 tests.

