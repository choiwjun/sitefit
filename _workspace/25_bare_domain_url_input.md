# Bare Domain URL Input

## Context
- Users expected `naver.com` to work without typing `https://`.
- Browser `type="url"` validation and server URL validation could reject bare domains before diagnosis started.

## Change
- Server URL validation now trims input and defaults bare domains to `https://`.
- Public diagnosis and consultation URL inputs use `type="text"` with `inputmode="url"` so `naver.com` can be submitted.
- After diagnosis, the lead form receives the normalized URL returned by the server, such as `https://naver.com/`.

## Verification
- Added URL policy coverage for bare domains.
- Added public UI coverage for URL-friendly text input.
- `npm.cmd test` passed with 112 tests.

