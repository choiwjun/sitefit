# 최종 검증

## 목표
사이트핏을 개발/SI 영업 전환에 맞는 진단형 플랫폼으로 계속 확장하고, 사용자에게 노출되는 문구를 한글 기준으로 유지합니다.

## 최근 검증 범위
- 공개 진단 화면은 URL만 입력받습니다.
- 무료/유료 구분 없이 전체 진단 결과를 공개합니다.
- 결과 화면은 mock 샘플 데이터가 아니라 실제 크롤링/룰 기반 분석 이슈를 표시합니다.
- 중복 이슈는 사이트 단위 개선 유형으로 묶고, 작업지시서는 전체 개선 유형을 모두 포함합니다.
- 고급 페이지 진단은 title 품질, meta description 길이, robots noindex, canonical 외부 참조, viewport, lang, JSON-LD 형식, 제목 구조, heading 계층, 본문량, OG 메타, 링크 앵커, 이미지 속성, 연락 수단까지 확인합니다.
- AEO 진단은 질문형 H2/H3, 질문 아래 직접 답변 문단, FAQPage schema 적용 여부를 확인합니다.
- GEO 진단은 Organization/LocalBusiness schema, sameAs, 브랜드 엔티티 설명, 인용 가능한 수치/기준/수행 이력 문장, 외부 신뢰 출처 링크를 확인합니다.
- 사이트 구조 진단은 중복 메타, 내부링크 고립, 수집되지 않은 내부 링크 대상, 문의/신뢰/핵심 서비스 페이지 커버리지를 확인합니다.
- 링크 상태 진단은 크롤링된 페이지의 링크 중 제한 수량을 점검해 4xx, 5xx, 리다이렉트 링크를 이슈화합니다.
- 업종별 보강 진단은 추정 업종에 따라 커머스 구매정보, 제조 상세정보, 교육 과정정보, B2B 의사결정 자료, 규제 업종 표현 리스크를 확인합니다.
- 성능 기초 진단은 정적 HTML 기준 렌더 차단 가능 CSS, defer/async 없는 동기 script, lazy loading 미적용 이미지를 확인합니다.
- JS 렌더링 진단은 sparse SPA shell을 감지해 렌더링 HTML과 렌더링 후 링크를 사용할 수 있습니다.
- 성능 심화 진단은 LCP, CLS, Total Blocking Time, 리소스 수, 전체/이미지 전송량을 확인합니다.
- 관리자 영업 UI는 영업 파이프라인, 상담 이력, 견적 상태, 재진단 히스토리 중심으로 재구성되었습니다.
- 공개 진단 결과 화면은 핵심 요약과 우선 개선 항목을 먼저 보여주고, 전체 이슈는 그룹별 더보기와 전체 이슈 펼쳐보기로 확인하도록 재구성되었습니다.
- 결과 화면과 공유 리포트는 페이지별 분석 근거 요약을 표시합니다.
- 기본 크롤 범위는 50페이지이고, 링크 상태 점검 기본 상한은 100개입니다.
- 결과 화면과 공유 리포트는 분석률, 수집 제외 URL, 링크 점검 수, JS 렌더링 페이지 수를 표시합니다.
- 분석엔진은 폼 입력 라벨 누락, 버튼 접근성 이름 누락, HTTPS 혼합 콘텐츠, 리다이렉트 체인 과다를 추가 탐지합니다.
- 분석엔진은 문자 인코딩 선언 누락, 중복 id, 안전하지 않은 form action, iframe title 누락을 추가 탐지합니다.
- 진단 run, 공개 결과 화면, 공유 리포트는 SiteFit rule 기반 웹 품질 점수(성능, 접근성, 보안 관행, SEO)를 표시합니다.
- PageSpeed 외부 API 연동은 보류하고, 로컬 HTML parser로 quoted/unquoted/boolean/mixed-case 속성 추출 정확도를 높였습니다.

## 실행 명령
- `node --check public/app.js`
- `node --check src/diagnosis/analyze-html.js`
- `node --check src/crawler/crawl-site.js`
- `node --check src/crawler/playwright-renderer.js`
- `node --check src/diagnosis/analyze-site.js`
- `node --check src/server.js`
- `node --check src/reporting/render-report-html.js`
- `node --check src/reporting/report-draft.js`
- `npm.cmd run test -- test\performance-ui.test.js test\diagnosis.test.js test\report-routes.test.js`
- `npm.cmd run test -- test\performance-ui.test.js test\diagnosis.test.js test\crawl-site.test.js test\admin-ui.test.js`
- `npm.cmd run test -- test/explanation.test.js test/public-ui.test.js`
- `npm.cmd test`
- `$env:PORT = '3001'; npm start`
- `curl.exe -s http://localhost:3001/health`

## 현재 검증 상태
- `node --check public/app.js`: 통과.
- `node --check src/reporting/report-draft.js`: 통과.
- `node --check src/diagnosis/analyze-html.js`: 통과.
- `node --check src/crawler/crawl-site.js`: 통과.
- `node --check src/crawler/playwright-renderer.js`: 통과.
- `node --check src/diagnosis/analyze-site.js`: 통과.
- `node --check src/server.js`: 통과.
- `node --check src/config.js`: 통과.
- `npm.cmd run test -- test/diagnosis.test.js`: 10개 통과, 실패 0개.
- `npm.cmd run test -- test/diagnosis.test.js test/site-structure.test.js`: 15개 통과, 실패 0개.
- `npm.cmd run test -- test\performance-ui.test.js test\diagnosis.test.js test\report-routes.test.js`: 12개 통과, 실패 0개.
- `npm.cmd run test -- test\performance-ui.test.js test\diagnosis.test.js test\crawl-site.test.js test\admin-ui.test.js`: 23개 통과, 실패 0개.
- `npm.cmd run test -- test/public-ui.test.js test/report-routes.test.js`: 4개 통과, 실패 0개.
- `npm.cmd run test -- test/config.test.js`: 2개 통과, 실패 0개.
- `npm.cmd run test -- test/server.test.js`: 19개 통과, 실패 0개.
- `npm.cmd run test -- test/public-ui.test.js test/report-routes.test.js`: 5개 통과, 실패 0개.
- `npm.cmd run test -- test/diagnosis.test.js`: 13개 통과, 실패 0개.
- `npm.cmd run test -- test/link-status.test.js`: 3개 통과, 실패 0개.
- `npm.cmd run test -- test/web-quality.test.js`: 2개 통과, 실패 0개.
- `npm.cmd run test -- test/html-parser.test.js`: 2개 통과, 실패 0개.
- `npm.cmd test`: 98개 통과, 실패 0개.
- 로컬 서버는 `http://localhost:3001/`에서 실행 중입니다.
- `curl.exe -s http://localhost:3001/health`: `{ "ok": true, "service": "sitefit" }` 응답.
- `https://www.digicore-lab.com/` 재진단 결과: 분석 페이지 8개, 주요 개선 유형 22개, 페이지별 탐지 95건, 작업지시서 22개, 종합 준비도 점수 70점.
- digicore-lab.com에서 새로 감지된 사이트 구조 이슈: 중복 title, 중복 meta description, 중복 H1.
- 첫 페이지 메타데이터 추출 확인: pageType `home`, schema 타입 `Organization`, `PostalAddress`, `ContactPoint`, 본문 단어 수 264, viewport 있음, 내부 링크 5개, 외부 링크 0개, 빈 앵커 0개, 이미지 크기 속성 누락 5개, 질문형 제목 0개, 직접 답변 0개, FAQ schema 없음, 엔티티 schema 있음, sameAs 없음, 인용 문장 0개, 외부 신뢰 링크 0개.
- 업종 카테고리 추정 기능 추가 및 테스트 확인: 예시 의료 페이지를 `병원/의료`로 분류.

## 남은 제약
- 코드 내부 식별자와 API 필드명은 시스템 계약을 위해 영어를 유지합니다.
- 실제 외부 AI 제공자 연동은 아직 `mock` 경계를 실제 provider로 교체해야 합니다.
