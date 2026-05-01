# 저장소 에이전트 가이드

이 파일은 저장소 전체에 적용되는 짧은 작업 기준입니다. 조건부 워크플로 상세는 `docs/harness/` 또는 `.agents/skills/`에 둡니다.

## 무엇인가
- 이 저장소는 `sitefit` 작업 흐름을 위한 휴대용 Codex 설정과 스킬을 포함합니다.
- 현재 핵심 자산은 `install.ps1`로 `$HOME\.codex\skills`에 설치되는 `harness-product-orchestrator` 스킬입니다.
- 저장소 전용 작업 지침은 `docs/harness/sitefit/`와 `.agents/skills/sitefit-orchestrator/`에 있습니다.

## 왜 필요한가
- Codex는 서로 다른 계획·디자인·구현 방식 사이를 오가지 않고 Harness 중심의 제품 엔지니어링 파이프라인을 따라야 합니다.
- 프로젝트 요구사항이 정리되기 전에는 프레임워크, 빌드, 테스트, 배포, 데이터베이스 선택을 임의로 확정하지 않습니다.

## 어떻게 작업하는가
- 포함된 Codex 스킬 설치: `powershell.exe -ExecutionPolicy Bypass -File .\install.ps1`
- 로컬 Codex 홈의 스킬을 저장소로 갱신: `powershell.exe -ExecutionPolicy Bypass -File .\export-current.ps1`
- 실질적인 제품 작업은 `.agents/skills/sitefit-orchestrator/SKILL.md`부터 확인합니다.
- 계획, 리뷰, QA 산출물은 `_workspace/` 아래에 보존합니다.
