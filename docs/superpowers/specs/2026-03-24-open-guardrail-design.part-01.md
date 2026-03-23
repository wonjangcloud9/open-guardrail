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
