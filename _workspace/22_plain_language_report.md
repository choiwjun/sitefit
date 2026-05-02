# Plain-Language Report UX

## Problem
- Diagnosis reports were too technical for non-specialists.
- Users could see issue names and work instructions, but it was not immediately clear what the issue meant, why it mattered, or what to fix first.

## Change
- Added a plain-language report layer at report generation time:
  - overall "한눈에 보는 진단 결과"
  - customer impact summary
  - first recommended action
  - per-issue plain title, category, meaning, business impact, and first fix
- Public result page now shows:
  - "일반 사용자용 요약"
  - plain issue explainers with "무슨 뜻인가요?", "왜 중요한가요?", "먼저 이렇게 고치세요"
  - clearer category labels such as "검색 노출 기본", "AI 답변 준비", "문의/구매 전환"
- Shared HTML report uses the same plain-language data.

## Verification
- Added tests for plain-language report draft fields.
- Added public UI and shared report route assertions for the new reader-friendly copy.
- Targeted tests passed:
  - `npm.cmd run test -- test/report-plain-language.test.js test/public-ui.test.js test/report-routes.test.js`

