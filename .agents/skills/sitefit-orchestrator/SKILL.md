---
name: sitefit-orchestrator
description: Harness 접수, 기획, 디자인, 구현, QA, 최종 검증을 통해 사이트핏 제품 작업을 조율합니다.
---

# 사이트핏 오케스트레이터

## 사용 시점
- 사이트핏의 실질적인 제품 엔지니어링 작업에 사용합니다.
- 요청에 작업 분류, 요구사항 정리, UI/UX 설계, 구현, 리뷰, QA, 배포 준비가 포함될 때 사용합니다.
- 단순 파일 확인이나 한 단계 답변에는 사용하지 않습니다.

## 필요한 입력
- 사용자의 목표 또는 문제 설명.
- 알려진 제품 제약, 대상 사용자, 원하는 결과물.
- 현재 저장소 상태와 기존 소스 코드.
- 수용 기준 또는 수용 기준을 먼저 작성해야 하는 명확한 이유.

## 작업 흐름
1. 요청을 작은 작업, 기획 중심, 디자인 중심, 개발 중심, 전체 제품 기능 중 하나로 분류합니다.
2. 목표, 가정, 범위, 리스크, 수용 기준을 `_workspace/01_intake.md`에 작성하거나 갱신합니다.
3. 기획 중심 작업은 구현 전에 `_workspace/02_spec.md`를 작성합니다.
4. UI/UX 작업은 구현 전에 `_workspace/03_design_handoff.md`를 작성합니다.
5. 구현 작업은 승인된 계획 범위 안에서 진행하고 결정 사항을 `_workspace/04_implementation_notes.md`에 기록합니다.
6. 의미 있는 동작 또는 사용자 영향이 있으면 `_workspace/05_review.md`와 `_workspace/06_qa.md`에 리뷰와 QA 근거를 남깁니다.
7. `_workspace/07_final_verification.md` 또는 간결한 최종 응답으로 검증 결과를 정리합니다.

## 라우팅
- Harness는 접수, 라우팅, 통합, 충돌 해결, 최종 go/no-go 판단을 담당합니다.
- Superpowers는 PRD, 스펙, 구현 계획, 수용 기준, 테스트 전략, 리스크 정리에 사용할 수 있습니다.
- Open Design은 UX 흐름, 프로토타입, 컴포넌트 스펙, 디자인 시스템, 시각 검토에 사용할 수 있습니다.
- gstack은 구현, 리팩터링, 코드 리뷰, QA, 문서, 릴리스 준비에 사용할 수 있습니다.

## 산출물
- `_workspace/01_intake.md`
- 기획이 필요한 경우 `_workspace/02_spec.md`
- 디자인이 필요한 경우 `_workspace/03_design_handoff.md`
- 코드 변경이 있는 경우 `_workspace/04_implementation_notes.md`
- 리뷰 근거가 필요한 경우 `_workspace/05_review.md`
- QA 근거가 필요한 경우 `_workspace/06_qa.md`
- 완료 근거가 필요한 경우 `_workspace/07_final_verification.md`

## 검증 기준
- 선택한 워크플로가 요청 규모와 리스크에 맞아야 합니다.
- 요구사항 근거 없이 제품 스택을 임의로 정하지 않습니다.
- 실질적인 작업은 수용 기준과 검증 근거를 남기고 끝냅니다.
- 저장소에 코드, 명령, 의존성이 없어 검증할 수 없는 경우 그 한계를 기록합니다.

## 참고
- `docs/harness/sitefit/team-spec.md`
- `AGENTS.md`
