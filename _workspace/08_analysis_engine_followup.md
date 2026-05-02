# 분석 엔진 후속 작업 기록

## 2026-05-02 진행
- 로컬 HTML parser 기반 메타 추출 위에 canonical 선언 개수, robots `nofollow`, hreflang alternate/x-default, 외부 도메인 script 인벤토리 추출을 추가했습니다.
- 새 진단 이슈: `canonical 중복 선언`, `robots nofollow 설정 확인 필요`, `hreflang x-default 누락`, `서드파티 스크립트 점검 필요`.
- SiteFit rule 기반 웹 품질 점수는 서드파티 스크립트 수를 성능과 보안 관행 점수에 반영합니다.
- PageSpeed/AI API 연동 없이도 무료 진단 플랫폼에서 기대하는 기본 SEO, 접근성, 성능 근거를 더 촘촘히 보여주는 방향으로 유지합니다.

## 검증
- `npm.cmd run test -- test/diagnosis.test.js`: 15개 통과.
- `npm.cmd run test -- test/web-quality.test.js`: 3개 통과.
- `node --check src/diagnosis/analyze-html.js`: 통과.
- `node --check src/diagnosis/web-quality.js`: 통과.
- `npm.cmd test`: 100개 통과, 실패 0개.
