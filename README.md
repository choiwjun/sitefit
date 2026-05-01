# 사이트핏 작업 환경

이 폴더는 사이트핏 애플리케이션과 Codex 작업 파이프라인 설정을 함께 보관합니다.

## 실행
테스트:

```powershell
npm test
```

로컬 서버:

```powershell
npm start
```

관리자 API 보호를 켜려면:

```powershell
$env:ADMIN_TOKEN="change-me"
npm start
```

`ADMIN_TOKEN`이 설정되면 관리자 및 영업 운영 API에는 다음 인증 헤더가 필요합니다.

```text
Authorization: Bearer change-me
```

진단 리포트 링크에는 `shareToken`이 포함됩니다. `ADMIN_TOKEN`이 설정된 환경에서 `/reports/:id`와 리포트 JSON 경로에 접근하려면 일치하는 `?token=` 값 또는 관리자 세션/헤더가 필요합니다.

AI 제공 방식:

```text
AI_PROVIDER=mock
```

현재는 외부 AI API를 바로 호출하지 않고, 동일한 애플리케이션 경계에서 동작하는 chat mock을 사용합니다. 진단 결과 본문은 mock 샘플 데이터가 아니라 실제 크롤링과 룰 기반 분석에서 나온 이슈명, 점수, 근거를 사용합니다.

크롤러 제한:

```text
CRAWLER_MAX_PAGES=10
CRAWLER_MAX_DEPTH=2
CRAWLER_MAX_BYTES=512000
CRAWLER_MAX_QUERY_PARAMS=8
CRAWLER_RENDER_JS=auto
```

`CRAWLER_RENDER_JS`는 `auto`, `always`, `off` 값을 사용할 수 있습니다. 기본값 `auto`는 SPA shell로 보이는 페이지에서만 선택적 JS 렌더러를 사용합니다. Playwright 기반 렌더링은 `src/crawler/playwright-renderer.js`에 분리되어 있으며, Playwright 패키지가 설치된 운영 환경에서 연결해 사용합니다.

접속 주소:

```text
http://localhost:3000/
http://localhost:3000/admin.html
http://localhost:3000/admin-login.html
```

현재 개발 환경에서 3000번 포트가 사용 중이면 3001번 포트로 실행합니다.

헬스 체크:

```text
http://localhost:3000/health
```

컨테이너 빌드:

```powershell
docker build -t sitefit .
```

## 공개 진단 흐름
- 첫 진단 폼은 사이트 URL 하나만 받습니다.
- 업종과 현재 목표는 초기 진단 전에 묻지 않고, 상담 신청 또는 관리자 보강 단계에서 수집합니다.
- 결과 화면은 실제 수집/분석 데이터 기반의 주요 이슈와 예상 작업 범위를 보여줍니다.
- SPA/React/Vue처럼 초기 HTML이 비어 있는 사이트는 선택적 JS 렌더링 경로를 통해 렌더링 후 HTML과 링크를 분석할 수 있습니다.
- 렌더러가 성능 데이터를 제공하면 LCP, CLS, Total Blocking Time, 리소스 전송량, 이미지 전송량도 진단 결과에 반영합니다.

## 다른 Windows PC 설치

저장소 루트에서 실행합니다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install.ps1
```

설치 스크립트는 포함된 스킬과 설정 사본을 다음 위치로 복사합니다.

```text
$HOME\.codex\skills
```

기존 스킬은 다음 위치에 백업합니다.

```text
$HOME\.codex\skill-backups
```

백업 없이 덮어쓰려면 `-Force`를 사용합니다.

```powershell
.\install.ps1 -Force
```

## 현재 PC 설정 내보내기

`$HOME\.codex\skills`의 로컬 작업 스킬 변경분을 프로젝트 복사본에 갱신하려면 다음을 실행합니다.

```powershell
.\export-current.ps1
```

## 포함된 기본값
- `sitefit-orchestrator`: SiteFit 제품 작업을 Harness 접수, 스펙, 디자인, 구현, QA, 최종 검증 흐름으로 조율합니다.
- `harness-product-orchestrator`: 제품 엔지니어링 작업 분류와 파이프라인 라우팅을 담당합니다.
