# 27. Vercel + Supabase 배포 준비

## 목표
- Vercel 서버리스 환경에서 기존 SiteFit Node HTTP 서버를 실행한다.
- 로컬 JSON 파일 저장소 대신 Supabase Postgres 기반 영속 저장소를 사용할 수 있게 한다.
- 로컬 개발과 기존 테스트는 Supabase 환경변수 없이 계속 JSON 저장소를 사용한다.

## 구현
- `api/index.js`를 추가해 Vercel Function 요청을 기존 `createServer()`로 전달한다.
- `vercel.json`에서 모든 경로를 `api/index.js`로 rewrite한다.
- `createStore()`를 추가해 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 있을 때 Supabase 저장소를 사용한다.
- `SupabaseStore`를 추가해 기존 `JsonStore`와 같은 run, lead, estimate, note, partner, assignment, monthly account 메서드를 제공한다.
- `supabase/schema.sql`에 단일 JSONB 레코드 테이블과 service role 전용 RLS 정책을 정의했다.
- README에 Vercel 환경변수와 Supabase SQL 적용 절차를 문서화했다.

## 배포 전 필요 조건
- Supabase SQL editor에서 `supabase/schema.sql` 실행
- Vercel 프로젝트 환경변수 설정
  - `ADMIN_TOKEN`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_RECORDS_TABLE=sitefit_records`
  - `CRAWLER_RENDERER=none`
  - `CRAWLER_RENDER_JS=auto`
  - `AI_PROVIDER=mock`

## 검증
- `npm.cmd test` 통과: 117개 테스트
- 로컬 서버 재기동 후 `http://127.0.0.1:3000/health` 정상 응답 확인

## 남은 사항
- 현재 로컬 Vercel CLI에 로그인 정보가 없어 `vercel env ls`와 실제 배포는 실행하지 못했다.
- Vercel 로그인 또는 `VERCEL_TOKEN` 설정 후 환경변수를 넣고 production deploy를 진행해야 한다.
