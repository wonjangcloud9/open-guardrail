# Phase 3: Ecosystem — Design Spec

## Overview

Phase 2(v0.5.0)에서 배포 준비 완료.
Phase 3는 "경쟁자가 못하는 것"을 선점하는 단계.
TS 네이티브 유일 범용 가드레일의 강점을 극대화.

## 핵심 차별점 (리서치 기반)

1. 범용 TS 가드레일은 open-guardrail뿐 (Python 중심 시장)
2. 스트리밍 검증 — 어떤 오픈소스도 제대로 안 됨
3. 에이전트 도구 호출 검증 — 미개척 영역
4. 한국 로케일 특화 — 경쟁자 0개
5. 규제 감사 로그 — EU AI Act/한국 AI 기본법 대응

## Goals (v0.7.0 → v0.9.0)

1. Vercel AI SDK 미들웨어 어댑터
2. 스트리밍 파이프라인 (청크 단위 검증)
3. 에이전트 도구 호출 검증 가드 (tool-call-validator)
4. 감사 로그 시스템 (AuditLogger + export)
5. 한국 AI 기본법 프리셋
6. 리스크 기반 라우팅 (low/medium/high)
