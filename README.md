# SiteFit

SiteFit은 웹사이트 URL만으로 SEO, GEO, AEO, 전환 구조, 신뢰 근거, 기본 접근성/성능 준비도를 진단하고 관리자 상담 파이프라인으로 연결하는 진단 플랫폼입니다.

## 실행

```powershell
npm install
npm start
```

기본 접속 주소:

```text
http://localhost:3000/
http://localhost:3000/admin-login.html
http://localhost:3000/admin.html
```

헬스체크:

```text
http://localhost:3000/health
```

테스트:

```powershell
npm test
```

## 환경변수

```text
PORT=3000
ADMIN_TOKEN=change-me
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_RECORDS_TABLE=sitefit_records
CRAWLER_MAX_PAGES=10
CRAWLER_MAX_DEPTH=2
CRAWLER_MAX_BYTES=512000
CRAWLER_MAX_QUERY_PARAMS=8
CRAWLER_RENDERER=none
CRAWLER_RENDER_JS=auto
AI_PROVIDER=mock
```

`ADMIN_TOKEN`을 설정하면 관리자 화면과 운영 API가 보호됩니다.

`SUPABASE_URL`과 `SUPABASE_SECRET_KEY` 또는 legacy `SUPABASE_SERVICE_ROLE_KEY`가 있으면 Supabase를 저장소로 사용합니다. Supabase 값이 없으면 로컬 개발용 `data/*.json` 저장소를 사용합니다.

`SUPABASE_SECRET_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`는 서버 환경변수로만 설정해야 하며 브라우저에 노출하면 안 됩니다.

## Supabase

Supabase SQL Editor에서 다음 파일을 실행합니다.

```text
supabase/schema.sql
```

CLI migration을 사용하는 경우에는 다음 파일도 같은 스키마를 담고 있습니다.

```text
supabase/migrations/20260502065000_create_sitefit_records.sql
```

## Vercel 배포

Vercel 프로젝트 환경변수에 최소한 다음 값을 설정합니다.

```text
ADMIN_TOKEN=충분히_긴_관리자_토큰
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SECRET_KEY=<server-secret-key>
SUPABASE_RECORDS_TABLE=sitefit_records
CRAWLER_RENDERER=none
CRAWLER_RENDER_JS=auto
AI_PROVIDER=mock
```

`vercel.json`은 모든 요청을 `api/index.js`로 전달합니다. Vercel Function은 기존 Node HTTP 서버를 재사용합니다.

## 공개 진단 흐름

- 사용자는 사이트 URL 하나만 입력합니다.
- URL에 `https://`가 없어도 기본적으로 `https://`로 보정합니다.
- 초기 진단은 실제 수집 페이지, 내부 링크, HTML, 메타 정보, 렌더링 근거를 기반으로 합니다.
- 결과 화면은 일반 사용자가 이해하기 쉬운 문제 요약과 우선순위 중심으로 보여줍니다.
- 상담 신청 내용은 관리자 화면에서 확인합니다.
