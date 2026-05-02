# Harness 1~4 작업 기록

## 목표
- 진단 결과를 견적/작업 패키지로 직접 연결합니다.
- 무료 진단 플랫폼 대비 신뢰 근거를 더 명확히 노출합니다.
- 5개 업종 샘플로 진단 품질이 빈 결과가 아닌 실행 제안으로 이어지는지 검증합니다.
- 관리자 화면에서 최신 진단의 추천 패키지와 다음 액션을 확인할 수 있게 합니다.

## 구현
- `src/sales/conversion-plan.js`를 추가해 전문가 의뢰 필요 이슈, 직접 수정 가능 이슈, 추천 패키지, 예상 기간, 다음 액션을 계산합니다.
- `src/server.js`의 진단 run에 `salesConversion`과 `trustEvidence`를 포함합니다.
- 공개 결과 화면과 공유 리포트에 `견적 전환 제안`, `진단 신뢰 근거` 섹션을 추가했습니다.
- 관리자 화면 운영 리소스 영역에 최신 진단 기준 추천 패키지와 다음 액션을 추가했습니다.

## 샘플 검증
- B2B 서비스, 병원/의료, 교육, 제조, 커머스 샘플 HTML을 대상으로 이슈 탐지와 패키지 매핑을 검증했습니다.

## 검증 명령
- `npm.cmd run test -- test/conversion-plan.test.js`
- `npm.cmd run test -- test/server.test.js`
- `npm.cmd run test -- test/public-ui.test.js test/report-routes.test.js`
- `npm.cmd run test -- test/admin-ui.test.js`
- `npm.cmd run test -- test/sample-sites-validation.test.js`
