# 구현 기록

## 구조
- Node.js 24 내장 `http`, `fetch`, `node:test` 기반 애플리케이션입니다.
- 외부 런타임 의존성 없이 실행되며, 현재 데이터는 로컬 JSON 파일로 저장합니다.
- `src/server.js`가 정적 HTML/CSS/JS와 API를 함께 제공합니다.

## 주요 결정
- 공개 진단 폼은 URL만 받습니다.
- 진단 결과는 실제 크롤링/사이트 자산/룰 기반 이슈에서 생성합니다.
- 외부 AI API 연동 전까지 chat mock을 사용하되, mock 샘플 데이터는 사용하지 않습니다.
- 고객 노출 문구는 한글 기준으로 정리합니다.
- 무료/유료 구분 없이 전체 진단 결과를 공개합니다.
- 특정 SI 회사만을 대상으로 하지 않고 다양한 업종의 회사와 운영자가 사용할 수 있도록 업종 카테고리 추정을 지원합니다.

## 전체 진단 결과 공개 변경
- 개발/SI 영업 전환이 목표이므로 진단된 전체 개선 유형과 작업지시서를 모두 보여줍니다.
- `src/reporting/report-draft.js`는 모든 고유 개선 유형을 `workOrders`에 포함합니다.
- `public/app.js`는 공개 결과 화면에서 전체 실제 분석 이슈를 모두 렌더링합니다.
- 원시 이슈는 페이지별 탐지 건수로 유지하고, 고객 화면에는 중복 이슈를 묶은 주요 개선 유형을 표시합니다.
- `test/explanation.test.js`와 `test/public-ui.test.js`에 상위 5개 제한이 다시 생기지 않도록 회귀 테스트를 추가했습니다.

## 분석 엔진 강화
- `src/diagnosis/analyze-html.js`가 페이지 유형, title, meta description, H1, canonical, JSON-LD schema 타입, outgoing link, 이미지 alt 통계를 추출합니다.
- `src/diagnosis/analyze-html.js`가 title 품질, viewport, html lang, JSON-LD 형식 오류, H1/H2 제목 구조, 본문 정보량, OG 메타, 실제 연락 수단 노출 여부를 추가 진단합니다.
- `src/diagnosis/analyze-html.js`가 일반 SEO 진단 플랫폼 수준의 robots noindex, meta description 길이, 외부 canonical, heading 계층 건너뜀, 이미지 width/height 누락, 빈 링크 앵커를 추가 진단합니다.
- `src/diagnosis/analyze-html.js`가 AEO 기준으로 질문형 H2/H3, 질문 아래 직접 답변 문단, FAQPage schema 적용 여부를 추가 진단합니다.
- `src/diagnosis/analyze-html.js`가 GEO 기준으로 Organization/LocalBusiness schema, sameAs, 브랜드 엔티티 설명, 인용 가능한 수치/기준/수행 이력 문장, 외부 신뢰 출처 링크를 추가 진단합니다.
- 페이지 메타데이터에 H1~H6 개수, heading 계층 오류, 본문 단어 수, OG 정보, robots meta, viewport/lang/charset, 내부/외부 링크 수, 빈 앵커 수, AEO 답변 준비도, GEO 엔티티/인용 신호, 연락 신호, 폼 통계를 포함합니다.
- `src/diagnosis/analyze-html.js`가 URL 입력만으로 병원/의료, 법률, 교육, 커머스, 제조, IT, 금융, 부동산, 식음료, 뷰티, 여행, 미디어, 공공/비영리, B2B 서비스 등 넓은 업종 카테고리를 추정합니다.
- `src/diagnosis/analyze-site.js`를 추가해 사이트 단위 중복 title, 중복 meta description, 중복 H1, 내부링크 고립 페이지, 수집되지 않은 내부 링크 대상, 문의/신뢰/핵심 서비스 페이지 커버리지 부족을 탐지합니다.
- `src/diagnosis/analyze-site.js`가 크롤링된 페이지들의 업종 추정값을 집계해 대표 업종 카테고리를 계산합니다.
- `src/diagnosis/link-status.js`가 크롤링된 페이지에서 추출한 링크를 제한 수량 안에서 점검해 깨진 링크, 서버 오류 링크, 리다이렉트 링크를 별도 이슈로 생성합니다.
- `src/diagnosis/industry-rules.js`가 추정 업종에 따라 커머스 구매정보, 제조 상세정보, 교육 과정정보, B2B 의사결정 자료, 의료/법률/금융 규제 표현 리스크를 보강 진단합니다.
- `src/diagnosis/analyze-html.js`가 렌더 차단 가능 CSS, defer/async 없는 동기 script, lazy loading 미적용 이미지 수를 `performanceStats`로 추출하고 성능 기초 이슈를 생성합니다.
- `src/crawler/crawl-site.js`가 sparse SPA shell을 감지하면 주입된 JS 렌더러를 사용해 렌더링 HTML과 렌더링 후 링크를 크롤링에 반영합니다.
- `src/crawler/playwright-renderer.js`를 추가해 Playwright 설치 환경에서는 렌더링 HTML, LCP, CLS, Total Blocking Time, 리소스 전송량, 이미지 전송량을 수집할 수 있게 했습니다. Playwright 패키지는 선택 의존성으로 취급해 미설치 환경의 기본 테스트와 서버 실행을 막지 않습니다.
- `src/diagnosis/analyze-html.js`가 렌더러에서 전달된 `runtimePerformance`를 기반으로 LCP 개선 필요, CLS 개선 필요, Total Blocking Time 개선 필요, 페이지 전송량 과다, 이미지 전송량 과다 이슈를 생성합니다.
- `src/server.js`는 사이트 구조, 링크 상태, 업종별 보강 이슈를 전체 이슈와 점수 산식에 포함합니다.
- `src/server.js`는 렌더러 주입, `CRAWLER_RENDER_JS`, `CRAWLER_RENDERER=playwright` 설정을 크롤러로 전달하고, 렌더링 성능 지표를 페이지 진단에 넘깁니다.
- `test/diagnosis.test.js`, `test/site-structure.test.js`, `test/link-status.test.js`, `test/industry-rules.test.js`, `test/performance-ui.test.js`에 페이지 메타데이터, 사이트 구조, 링크 상태, 업종별 룰, 성능 근거 노출 테스트를 추가했습니다.
- `test/crawl-site.test.js`에 SPA shell 렌더링과 렌더링 후 링크 크롤링 테스트를 추가했습니다.

## 진단 신뢰도 표시 개선
- 작업지시서는 중복 카드 대신 `영향 URL N개`와 대표 근거를 표시합니다.
- 공개 결과 화면과 공유 리포트에 `분석 근거 요약`을 추가해 페이지별 유형, H1/H2 개수, 본문량, 질문형 제목/직접 답변 수, FAQ schema, 엔티티 schema, 인용 문장 수, 외부 신뢰 링크 수, 내부/외부 링크 수, 빈 앵커 수, 이미지 alt/크기 속성 누락, 렌더 차단 CSS 수, 동기 script 수, lazy 미적용 이미지 수, schema, viewport, robots 상태를 보여줍니다.
- 공개 결과 화면과 공유 리포트의 근거 요약에 LCP, CLS, TBT, 전송량을 추가했습니다.
- 무료 진단 경쟁력 강화를 위해 기본 크롤 범위를 10페이지에서 50페이지로 올리고, 링크 상태 점검 기본 상한을 100개로 설정했습니다.
- `src/server.js`는 진단 run에 `analysisCoverage`를 포함해 분석 페이지 수, 발견 URL, 수집 제외 URL, 링크 점검 수, JS 렌더링 페이지 수, 최대 수집 범위를 기록합니다.
- 공개 결과 화면과 공유 리포트는 `분석률`, `수집 제외`, `링크 점검`, `JS 렌더링`을 별도 신뢰 지표로 노출합니다.
- `src/diagnosis/analyze-html.js`가 접근성 기초 항목으로 라벨 없는 폼 입력, 접근성 이름 없는 버튼을 진단하고, HTTPS 페이지의 `http://` 혼합 콘텐츠를 탐지합니다.
- `src/diagnosis/link-status.js`가 status fetcher에서 `redirectCount` 또는 `redirectChain`을 제공하는 경우 리다이렉트 체인 과다 이슈를 별도 생성합니다.
- `src/diagnosis/analyze-html.js`가 문자 인코딩 선언 누락, 중복 `id` 속성, 안전하지 않은 form action, iframe title 누락을 추가 진단합니다.
- `src/diagnosis/web-quality.js`를 추가해 현재 수집된 진단 근거에서 성능, 접근성, 보안 관행, SEO, 종합 웹 품질 점수를 계산합니다. 실제 Lighthouse/PageSpeed 점수라고 주장하지 않고 `sitefit-rules` 출처를 명시합니다.
- `src/server.js`는 진단 run에 `webQualityScores`를 포함하고, 공개 결과 화면과 공유 리포트는 `웹 품질 점수` 섹션으로 노출합니다.
- PageSpeed 외부 API 연동은 보류했습니다. 현재 단계에서는 외부 API 의존성보다 로컬 진단 근거와 작업 범위 설명의 신뢰도를 높이는 것이 우선입니다.
- `src/diagnosis/html-parser.js`를 추가해 quoted/unquoted/boolean/mixed-case HTML 속성을 일관되게 읽습니다.
- `src/diagnosis/analyze-html.js`의 meta, canonical, viewport/lang/charset, image, link, form, iframe 속성 추출이 로컬 parser를 사용하도록 변경되었습니다.
- `public/admin.html`을 영업팀 업무 흐름 중심으로 재구성해 영업 파이프라인 보드, 검색/필터, 상담 이력 저장, 견적 상태 변경, 재진단 비교, 진단 기록, 운영 리소스를 한 화면에서 확인할 수 있게 했습니다.
- `public/app.js`의 진단 결과 화면을 긴 목록형 출력에서 핵심 요약, 지표 카드, 영역별 점수, 우선 개선 항목, 예상 작업 범위, 진단 영역별 결과, 페이지별 분석 근거 요약, 전체 이슈 펼쳐보기 구조로 재구성했습니다.
- 전체 이슈는 계속 공개하되 첫 화면에서는 우선순위와 그룹별 요약을 먼저 보여주고, 나머지는 영역별 더보기와 전체 이슈 접기/펼치기로 확인하도록 변경했습니다.
- `public/styles.css`에 결과 전용 카드, 점수 막대, 지표 스트립, 그룹 카드, 근거 카드 스타일을 추가해 긴 설명이 한 줄 벽처럼 보이지 않도록 조정했습니다.
- robots.txt, sitemap.xml 같은 사이트 자산 이슈도 종합 점수에 반영합니다.
- digicore-lab.com 검증에서 `robots.txt`는 존재하지만 `Sitemap:` 지시문이 없고, `/sitemap.xml`은 404임을 확인했습니다.

## 향후 강화 과제
- JSON 파일 저장소에서 운영용 데이터베이스로 이전.
- 실제 외부 AI 제공자 연동.
- 업종별 금지 표현 룰 정교화.
- 관리자 영업 워크플로 UI 고도화.
