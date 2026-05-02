# 로컬 변경분 릴리즈 노트

작성일: 2026-05-02
상태: 로컬 변경만 존재, GitHub 미반영

## 요약

이번 로컬 작업은 SiteFit 무료 진단의 영업 전환력을 높이기 위한 묶음이다. 핵심은 분석 신뢰도 표기 보강, 상담 전환 문구 강화, 실제 URL 검증, 고정 데모 fixture, 관리자 데모 실행/필터/정리 플로우다.

## 기능 묶음

### 1. 분석 엔진 신뢰도 보정

- 대형 사이트에서 `분석률`만 보면 엔진이 약해 보이는 문제를 완화했다.
- `analysisCoverage`에 다음 값을 추가했다.
  - `crawlBudgetUsageRate`
  - `isSampledCrawl`
  - `skippedReasonCounts`
- 공개 결과 화면과 공유 HTML 리포트에 `수집 한도 사용`을 노출했다.
- 커머스 홈/개요 페이지에서는 일반 가격/절차/비교 누락 이슈를 완화했다.
  - 상품 가격은 상세/카테고리 페이지에 있을 수 있기 때문이다.
  - 커머스 구매 정보 룰은 업종 룰에서 유지한다.

주요 파일:
- `src/server.js`
- `src/diagnosis/analyze-html.js`
- `src/reporting/render-report-html.js`
- `public/app.js`

### 2. 영업 전환 문구 강화

- `createSalesConversionPlan`에 `salesTalkTrack`을 추가했다.
- 추천 패키지별 `salesAngle`을 추가했다.
- 관리자와 공개 리포트에서 상담 포인트를 확인할 수 있게 했다.
- 사용자가 업종을 지정한 경우 상담 문구가 해당 업종 라벨을 우선 반영하도록 했다.

주요 파일:
- `src/sales/conversion-plan.js`
- `src/server.js`
- `public/app.js`
- `public/admin.html`

### 3. 실제 URL 검증

실제 사이트 5개 유형을 진단해 결과 품질을 확인했다.

- HubSpot: B2B/소프트웨어
- Cleveland Clinic: 병원/의료
- Coursera: 교육
- Bosch: 제조/산업
- Allbirds: 커머스

결론:
- 실제 HTML/링크/렌더링 근거만으로도 영업 상담에 쓸 수 있는 이슈와 패키지가 생성된다.
- 단, 대형 사이트는 표본 진단이므로 `분석률`과 `수집 한도 사용률`을 함께 보여줘야 한다.

기록:
- `_workspace/11_real_url_validation.md`

### 4. 고정 데모 fixture

외부 URL 변동성 없이 영업 시연과 회귀 테스트가 가능하도록 5개 업종 fixture를 추가했다.

- B2B 서비스
- 병원/의료
- 교육/학원
- 제조/산업
- 쇼핑몰/커머스

주요 파일:
- `src/demo/site-fixtures.js`
- `test/demo-site-fixtures.test.js`
- `test/sample-sites-validation.test.js`

### 5. 관리자 데모 실행 플로우

관리자 화면에서 fixture 기반 데모 리포트를 생성할 수 있게 했다.

- `GET /api/admin/demo-fixtures`
- `POST /api/admin/demo-runs`
- 데모 생성 시 `run`, `lead`, `estimate`를 함께 생성
- 생성 직후 `리포트 열기`, 리드 ID, 견적 ID를 표시
- 생성 직후 `데모만` 필터로 자동 전환

주요 파일:
- `src/server.js`
- `public/admin.html`
- `test/server.test.js`
- `test/admin-ui.test.js`

### 6. 관리자 데모 데이터 필터/정리

데모와 실고객 데이터를 분리해서 볼 수 있게 했다.

- 데이터 범위 필터: `전체`, `실고객만`, `데모만`
- 데모 run에는 `Demo` 배지를 표시
- `DELETE /api/admin/demo-data` 추가
- 삭제 확인 문구: `DELETE_DEMO_DATA`
- 데모 run/lead/estimate 및 관련 메모/배정/월관리만 삭제
- 실고객 데이터와 파트너 목록은 유지

주요 파일:
- `src/storage/json-store.js`
- `src/server.js`
- `public/admin.html`
- `public/styles.css`

## 검증 산출물

- `_workspace/10_report_quality_review.md`
- `_workspace/11_real_url_validation.md`
- `_workspace/12_demo_fixture_validation.md`
- `_workspace/13_admin_demo_runner.md`
- `_workspace/14_admin_demo_filter.md`
- `_workspace/15_admin_demo_result_links.md`
- `_workspace/16_admin_demo_browser_qa.md`
- `_workspace/17_admin_demo_cleanup.md`
- `_workspace/18_admin_demo_cleanup_browser_qa.md`

## 배포 전 주의

- 아직 GitHub에 올리지 않았다.
- 운영에서 데모 데이터 정리 API를 허용할지 검토가 필요하다.
- 관리자 토큰 설정이 없는 환경에서는 관리자 API가 열릴 수 있으므로 운영 배포 전 `ADMIN_TOKEN` 확인이 필요하다.
- 실제 로컬 `data/`의 데모 데이터는 삭제하지 않았다. 삭제는 관리자 화면에서 확인 문구를 입력해야 실행된다.
