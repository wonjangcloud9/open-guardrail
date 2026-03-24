# Phase 3: Ecosystem — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스트리밍 파이프라인, 에이전트 도구 검증, 감사 로그, 리스크 라우팅, Vercel AI 어댑터, 한국 AI 기본법 프리셋 — 경쟁자 없는 기능으로 차별화.

**Architecture:** 코어 엔진 확장 (streaming, router, audit) + 새 가드 (tool-call-validator) + 어댑터 패키지 (vercel-ai). Guard 인터페이스 하위호환 확장.

**Tech Stack:** TypeScript, Vercel AI SDK, ReadableStream, AsyncIterable

**Spec:** `docs/superpowers/specs/2026-03-24-phase3-ecosystem.part-01.md` ~ `part-04.md`
