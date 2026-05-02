# 영업 데모용 고정 샘플 Fixture

작성일: 2026-05-02

## 목적

실제 외부 URL은 차단, 리다이렉트, 네트워크 상태, 사이트 개편에 따라 진단 결과가 달라진다. 영업 데모와 회귀 테스트에서는 매번 같은 결과가 필요하므로 5개 업종별 고정 HTML fixture를 추가했다.

## 추가 파일

- `src/demo/site-fixtures.js`
  - `DEMO_SITE_FIXTURES`: B2B 서비스, 병원/의료, 교육/학원, 제조/산업, 쇼핑몰/커머스 샘플
  - `analyzeDemoSiteFixture(fixture)`: 실제 진단 엔진, 사이트 구조 분석, 업종 룰, 패키지 추천, 신뢰 근거 요약까지 한 번에 생성
- `test/demo-site-fixtures.test.js`
  - 5개 fixture가 모두 분석률 100%, 수집 한도 사용 100%, 추천 패키지, 상담 문구를 생성하는지 검증
- `test/sample-sites-validation.test.js`
  - 기존 단편 샘플 대신 동일 fixture를 사용하도록 연결

## 검증 기준

- 각 업종 fixture는 2페이지 이상을 포함한다.
- `pagesAnalyzed`가 fixture 페이지 수와 일치한다.
- `analysisCoverage.analysisRate`는 100이다.
- `analysisCoverage.crawlBudgetUsageRate`는 100이다.
- `analysisCoverage.isSampledCrawl`은 false다.
- 이슈와 추천 패키지가 1개 이상 생성된다.
- 상담 헤드라인에 업종 라벨이 반영된다.
- 신뢰 근거 카드에 `수집 한도 사용`이 포함된다.

## 영업 활용 방식

데모에서는 외부 URL을 직접 치는 대신 fixture 결과를 기준으로 분석 리포트의 구조와 영업 전환 흐름을 보여준다. 실제 고객 URL 진단은 별도 실행하되, 데모 품질 확인과 회귀 테스트는 fixture를 기준으로 고정한다.

## 다음 권장 작업

데모 fixture 결과를 관리자 화면에서 바로 불러올 수 있는 내부 전용 엔드포인트 또는 스크립트를 추가하면 시연 준비 시간이 줄어든다. 단, 공개 사용자에게 노출되면 안 되므로 `NODE_ENV !== 'production'` 또는 관리자 토큰 조건을 붙이는 방식이 적합하다.
