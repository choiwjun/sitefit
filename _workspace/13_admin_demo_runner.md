# 관리자 데모 실행 기능

작성일: 2026-05-02

## 목적

영업 시연에서 실제 외부 URL 수집에 의존하지 않고, 고정 fixture 기반으로 진단 리포트, 리드, 견적 초안을 즉시 생성할 수 있게 했다.

## 구현 내용

- `GET /api/admin/demo-fixtures`
  - 관리자 화면에서 선택 가능한 데모 업종 목록을 반환한다.
  - B2B 서비스, 병원/의료, 교육/학원, 제조/산업, 쇼핑몰/커머스 5개 fixture를 사용한다.
- `POST /api/admin/demo-runs`
  - 요청 본문: `{ "fixtureId": "commerce" }`
  - fixture 기반 진단 run을 생성하고 저장한다.
  - 데모 lead를 생성한다.
  - 해당 lead의 견적 초안을 생성한다.
  - 응답에 `run`, `lead`, `estimate`를 함께 반환한다.
- `public/admin.html`
  - 관리자 화면에 `영업 데모 실행` 패널을 추가했다.
  - 업종 선택 후 `데모 리포트 생성`을 누르면 관리자 데이터에 run/lead/estimate가 생성된다.

## 보안/운영 기준

- `/api/admin/*` 경로는 관리자 토큰이 설정된 경우 인증을 요구한다.
- 이번 작업에서 관리자 API 인증 범위를 `GET /api/admin/*`에서 모든 `/api/admin/*` 요청으로 넓혔다.
- 공개 진단 화면에는 데모 실행 기능을 노출하지 않는다.

## 검증

- `test/server.test.js`
  - 인증 없는 데모 생성 요청은 401
  - 인증된 데모 생성 요청은 201
  - run, lead, estimate가 함께 생성되는지 검증
- `test/admin-ui.test.js`
  - 관리자 화면에 데모 실행 패널, fixture API, 생성 API, `createDemoRun` 핸들러가 있는지 검증

## 다음 권장 작업

관리자 화면에서 방금 생성한 데모 리포트 링크를 더 눈에 띄게 보여주고, 데모 데이터만 필터링하는 토글을 추가하면 반복 시연이 더 편해진다.
