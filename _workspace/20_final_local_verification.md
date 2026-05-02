# 최종 로컬 검증 체크리스트

작성일: 2026-05-02
상태: GitHub 미반영

## 현재 상태

- 로컬 서버: `http://127.0.0.1:3000`
- 최근 헬스체크: 정상
- 전체 테스트: `npm.cmd test` 통과
- 현재 변경분은 커밋되지 않은 working tree 상태다.

## 완료된 검증

### 자동 테스트

- `node --check src/server.js`
- `node --check src/storage/json-store.js`
- `node --check test/server.test.js`
- `node --check test/admin-ui.test.js`
- `npm.cmd run test -- test/admin-ui.test.js test/server.test.js`
- `npm.cmd test`

최근 전체 테스트 결과:

- `107 pass`
- `0 fail`

### 브라우저 QA

관리자 데모 생성:

- Chrome headless + CDP로 `admin.html` 접속
- 데모 fixture 5개 로드 확인
- `commerce` 데모 생성
- `데모만` 필터 자동 전환 확인
- `리포트 열기` 링크 확인
- 리포트 링크 200 확인
- `Demo` 배지 확인

관리자 데모 정리:

- 임시 데이터 저장소에서 별도 서버 실행
- 데모 생성 후 pipeline/run/estimate row 생성 확인
- `DELETE_DEMO_DATA` 확인 문구 입력
- 데모 데이터 정리 후 pipeline/run/estimate row 0건 확인
- API 저장소 카운트 leads/runs/estimates 0건 확인

## 커밋 전 권장 분할

현재 변경분이 크므로 한 번에 커밋하기보다 아래 단위로 나누는 것이 안전하다.

1. 분석 엔진 신뢰도 및 영업 전환 문구
   - `src/diagnosis/analyze-html.js`
   - `src/sales/conversion-plan.js`
   - `src/server.js`
   - `public/app.js`
   - `src/reporting/render-report-html.js`
   - 관련 테스트

2. 데모 fixture와 샘플 검증
   - `src/demo/site-fixtures.js`
   - `test/demo-site-fixtures.test.js`
   - `test/sample-sites-validation.test.js`
   - `_workspace/12_demo_fixture_validation.md`

3. 관리자 데모 실행/필터/정리
   - `public/admin.html`
   - `public/styles.css`
   - `src/server.js`
   - `src/storage/json-store.js`
   - `test/admin-ui.test.js`
   - `test/server.test.js`
   - 관련 `_workspace/13~18` 문서

4. 검증/릴리즈 문서
   - `_workspace/10~20`

## 남은 리스크

- 운영 환경에서 `ADMIN_TOKEN`이 비어 있으면 관리자 API가 인증 없이 열린다.
- 데모 삭제 API는 확인 문구가 있지만, 운영에서 허용할지 정책 판단이 필요하다.
- 현재 브라우저 QA 스크립트는 수동 실행 형태다. 장기적으로는 자동 e2e 테스트로 고정하는 것이 좋다.
- 실제 외부 URL 진단은 사이트 차단/리다이렉트/네트워크 상태에 따라 결과가 달라질 수 있다.

## 배포 전 체크

- `ADMIN_TOKEN` 설정 확인
- 저장소 `data/` 백업 여부 확인
- 데모 데이터 정리 API 운영 허용 여부 확인
- GitHub 업로드 범위 확인
- 배포 후 `/health`, `/admin.html`, `/api/admin/demo-fixtures` 확인

## Go/No-Go

로컬 기능 검증 기준으로는 Go.

운영 배포 기준으로는 `ADMIN_TOKEN`과 데모 삭제 API 정책 확인 후 Go.
