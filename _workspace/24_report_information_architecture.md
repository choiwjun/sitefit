# Report Information Architecture Cleanup

## Problem
- The report page showed summary, scores, packages, evidence, and full issue details with similar visual weight.
- Non-technical users had to scan too much technical evidence before understanding what matters.

## Decision
- Reordered public and shared reports into:
  1. `리포트 핵심 요약`
  2. compact dashboard metrics
  3. `일반 사용자용 요약`
  4. top 3 `먼저 볼 개선 항목`
  5. consultation/work direction without public prices
  6. collapsed `상세 진단 근거 보기`
- Technical scores, crawl coverage, trust evidence, grouped issues, full issue lists, and page evidence now live in the detailed evidence section.
- Public price ranges remain hidden and display `상담에서 범위 확정`.

## Verification
- Added/updated public UI and shared report route assertions for the new structure.
- Targeted tests passed:
  - `npm.cmd run test -- test/public-ui.test.js test/report-routes.test.js`

