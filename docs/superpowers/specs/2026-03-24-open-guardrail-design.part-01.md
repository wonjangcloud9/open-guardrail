# open-guardrail Design Spec

## Overview

LLM 앱 개발자를 위한 오픈소스 가드레일 엔진.
프로바이더 무관, 텍스트 인풋/아웃풋 미들웨어.
npm 패키지로 배포, 브라우저/Node/Edge 풀스택 지원.

## Core Concepts

- **Guard**: 단일 검사 단위 `(text, ctx) → GuardResult`
- **Pipeline**: Guard 체이닝. `fail-fast` / `run-all` 모드
- **EventBus**: `guard:before`, `guard:after`, `guard:blocked` 훅
- **RuleSet**: YAML/JSON 선언적 설정 → Pipeline 변환
- **Config Loader**: 설정 파일 파싱 + Zod 스키마 검증
- **Aggregator**: 개별 GuardResult → PipelineResult 집계

## Architecture (Hybrid)

3가지 접근법의 장점을 결합한 하이브리드 구조:

1. **파이프라인 체이닝** — 유연한 프로그래매틱 조합
2. **선언적 룰셋** — 코드 변경 없이 YAML/JSON 설정
3. **이벤트 훅** — 느슨한 결합, 비동기 확장

## Aggregation Rules

- **fail-fast**: 첫 번째 `block` 결과 시 즉시 중단, 해당 action 반환
- **run-all**: 모든 가드 실행 후 가장 엄격한 action 반환
- Action 우선순위: `block` > `override` > `warn` > `allow`
- `passed`는 최종 action이 `block`이 아닐 때 `true` (`allow`, `warn`, `override` 모두 통과)

## Error Handling

- 가드 예외 발생 시 기본 **fail-closed** (`block` 처리)
- 설정으로 `onError: 'block' | 'allow' | 'warn'` 변경 가능
- 모든 가드에 `timeoutMs` 설정 가능 (기본 5000ms)
- 타임아웃 시 `GuardError` 타입으로 결과에 포함
- AI 위임 가드는 네트워크 에러 시 재시도 없이 즉시 실패
