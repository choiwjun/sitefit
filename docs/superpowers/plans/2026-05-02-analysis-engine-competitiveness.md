# Analysis Engine Competitiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SiteFit's free diagnosis feel deeper and more credible by increasing crawl depth and exposing analysis coverage.

**Architecture:** Keep the existing Node.js server and JSON response shape, then add a compact `analysisCoverage` object to diagnosis runs. The public UI and shared HTML report render that object as trust evidence without changing the URL-only intake flow.

**Tech Stack:** Node.js built-in test runner, Node HTTP server, static HTML/CSS/JS, JSON store.

---

### Task 1: Default Crawl Depth

**Files:**
- Modify: `src/config.js`
- Test: `test/config.test.js`

- [x] **Step 1: Write the failing test**

Expect `loadConfig({}).crawler.maxPages` to be `50` and expose `maxLinkChecks` as `100`.

- [x] **Step 2: Run test to verify it fails**

Run: `npm.cmd run test -- test/config.test.js`

- [x] **Step 3: Write minimal implementation**

Change default `CRAWLER_MAX_PAGES` fallback to `50` and add `CRAWLER_MAX_LINK_CHECKS` fallback `100`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm.cmd run test -- test/config.test.js`

### Task 2: Analysis Coverage Contract

**Files:**
- Modify: `src/server.js`
- Test: `test/server.test.js`

- [x] **Step 1: Write the failing test**

Assert diagnosis responses include `analysisCoverage` with analyzed pages, max pages, skipped URLs, checked links, and rendered pages.

- [x] **Step 2: Run test to verify it fails**

Run: `npm.cmd run test -- test/server.test.js`

- [x] **Step 3: Write minimal implementation**

Build coverage from crawl result, link status result, and crawler config.

- [x] **Step 4: Run test to verify it passes**

Run: `npm.cmd run test -- test/server.test.js`

### Task 3: Customer-Facing Coverage Display

**Files:**
- Modify: `public/app.js`
- Modify: `src/reporting/render-report-html.js`
- Test: `test/public-ui.test.js`
- Test: `test/report-routes.test.js`

- [x] **Step 1: Write the failing test**

Assert UI/report code contains Korean coverage labels including `분석률`, `수집 제외`, `링크 점검`, and `JS 렌더링`.

- [x] **Step 2: Run test to verify it fails**

Run: `npm.cmd run test -- test/public-ui.test.js test/report-routes.test.js`

- [x] **Step 3: Write minimal implementation**

Render coverage cards from `run.analysisCoverage`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm.cmd run test -- test/public-ui.test.js test/report-routes.test.js`

### Task 4: Verification

**Files:**
- Modify: `_workspace/04_implementation_notes.md`
- Modify: `_workspace/06_qa.md`
- Modify: `_workspace/07_final_verification.md`

- [x] Run `npm.cmd test`.
- [x] Record the updated test count and remaining risks.

### Task 5: Issue Catalog Expansion

**Files:**
- Modify: `src/diagnosis/analyze-html.js`
- Modify: `src/diagnosis/link-status.js`
- Test: `test/diagnosis.test.js`
- Test: `test/link-status.test.js`

- [x] **Step 1: Write the failing tests**

Add tests for unlabeled form controls, empty buttons, HTTPS mixed content, and redirect chains.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm.cmd run test -- test/diagnosis.test.js` and `npm.cmd run test -- test/link-status.test.js`.

### Task 9: Free Diagnostic Platform SEO Parity Signals

**Files:**
- Modify: `src/diagnosis/analyze-html.js`
- Modify: `src/diagnosis/web-quality.js`
- Test: `test/diagnosis.test.js`
- Test: `test/web-quality.test.js`
- Add: `_workspace/08_analysis_engine_followup.md`

- [x] **Step 1: Write the failing tests**

Add coverage for duplicate canonical declarations, robots `nofollow`, hreflang `x-default`, and third-party script inventory.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm.cmd run test -- test/diagnosis.test.js` and `npm.cmd run test -- test/web-quality.test.js`.

- [x] **Step 3: Write minimal implementation**

Add metadata extraction and issue cards for canonical/hreflang/robots/script checks, then include third-party scripts in SiteFit rule quality scoring.

- [x] **Step 4: Run verification**

Run: `node --check src/diagnosis/analyze-html.js`, `node --check src/diagnosis/web-quality.js`, and `npm.cmd test` (100 pass, 0 fail).

### Task 6: Additional Technical SEO And Accessibility Checks

**Files:**
- Modify: `src/diagnosis/analyze-html.js`
- Test: `test/diagnosis.test.js`

- [x] **Step 1: Write the failing test**

Add coverage for missing charset declarations, duplicate `id` attributes, insecure form actions, and iframe title gaps.

- [x] **Step 2: Run test to verify it fails**

Run: `npm.cmd run test -- test/diagnosis.test.js`.

### Task 7: Lighthouse-Style Web Quality Scores

**Files:**
- Create: `src/diagnosis/web-quality.js`
- Modify: `src/server.js`
- Modify: `public/app.js`
- Modify: `src/reporting/render-report-html.js`
- Test: `test/web-quality.test.js`
- Test: `test/server.test.js`
- Test: `test/public-ui.test.js`
- Test: `test/report-routes.test.js`

- [x] **Step 1: Write the failing tests**

Add tests for `webQualityScores` and public/shared report labels.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm.cmd run test -- test/web-quality.test.js`, `npm.cmd run test -- test/server.test.js`, and `npm.cmd run test -- test/public-ui.test.js test/report-routes.test.js`.

- [x] **Step 3: Write minimal implementation**

Compute `performance`, `accessibility`, `bestPractices`, `seo`, and `overall` from existing SiteFit rule evidence.

- [x] **Step 4: Run tests to verify they pass**

Run the same target tests.

### Task 8: Local HTML Attribute Parser

**Files:**
- Create: `src/diagnosis/html-parser.js`
- Modify: `src/diagnosis/analyze-html.js`
- Test: `test/html-parser.test.js`
- Test: `test/diagnosis.test.js`

- [x] **Step 1: Record PageSpeed API deferral**

Document that external PageSpeed API integration is deferred in favor of local rule evidence and parser accuracy.

- [x] **Step 2: Write failing parser tests**

Add tests for quoted, unquoted, boolean, and mixed-case attributes, plus diagnosis extraction from unquoted attributes.

- [x] **Step 3: Run tests to verify they fail**

Run: `npm.cmd run test -- test/html-parser.test.js` and `npm.cmd run test -- test/diagnosis.test.js`.

- [x] **Step 4: Implement local parser and connect it**

Add `findTags()` and `attr()`, then route metadata, image, link, form, and technical extraction through the parser.

- [x] **Step 5: Run tests to verify they pass**

Run: `npm.cmd run test -- test/html-parser.test.js` and `npm.cmd run test -- test/diagnosis.test.js`.

- [x] **Step 3: Write minimal implementation**

Add `technicalBasics`, `formStats`, and `accessibilityStats` fields plus issue definitions and recommendations.

- [x] **Step 4: Run test to verify it passes**

Run: `npm.cmd run test -- test/diagnosis.test.js`.

- [x] **Step 3: Write minimal implementation**

Add metadata and issues for form labels, button names, mixed content, and redirect chain counts.

- [x] **Step 4: Run tests to verify they pass**

Run: `npm.cmd run test -- test/diagnosis.test.js` and `npm.cmd run test -- test/link-status.test.js`.
