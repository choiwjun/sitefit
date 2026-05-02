# 관리자 데모 데이터 정리 브라우저 QA

작성일: 2026-05-02

## 목적

데모 데이터 정리 기능이 실제 브라우저에서 안전하게 동작하는지 확인했다. 현재 로컬 `data/`는 건드리지 않기 위해 임시 데이터 저장소로 별도 서버를 띄우고 Chrome headless + CDP로 검증했다.

## 검증 방식

- 임시 서버: `createServer({ dataDir: <temp>, adminToken: '' })`
- 브라우저: Chrome headless
- 조작 방식: Chrome DevTools Protocol
- 검증 후 임시 데이터 디렉터리 삭제

## 시나리오

1. 관리자 화면 접속
2. 데모 fixture 5개 로드 확인
3. `commerce` 데모 생성
4. 생성 후 `데모만` 필터 자동 전환 확인
5. 파이프라인 카드, 진단 기록, 견적 row, Demo 배지 확인
6. `데모 데이터 정리` 버튼 클릭
7. prompt에 `DELETE_DEMO_DATA` 입력
8. 화면에서 데모 run/lead/estimate가 사라졌는지 확인
9. 관리자 API로 저장소 카운트가 0인지 확인

## 결과

통과.

검증값:

- fixture 옵션 수: 5
- 정리 버튼 존재: true
- 데모 생성 후
  - scope: `demo`
  - pipeline cards: 1
  - run rows: 1
  - estimate rows: 1
  - demo badges: 1
  - result contains lead/estimate ids: true
- 데모 정리 후
  - scope: `demo`
  - pipeline cards: 0
  - run rows: 0
  - estimate rows: 0
  - demo badges: 0
- 저장소 카운트
  - leads: 0
  - runs: 0
  - estimates: 0

## 판정

관리자 데모 생성/정리 플로우는 실제 브라우저 기준으로 동작한다. 현재 로컬 운영 데이터는 삭제하지 않았다.
