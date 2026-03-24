# Phase 2: Production-Ready — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** npm 배포 가능 상태로 만들기 — 메타데이터, exports, examples, 프리셋, 오픈소스 인프라, CI/CD, 전 패키지 v0.5.0 통일.

**Architecture:** 기존 모노레포 구조 유지. 코드 변경은 최소화, 메타데이터/설정/문서/예제 중심.

**Tech Stack:** TypeScript, pnpm, turborepo, tsup, vitest, ESLint, Prettier, changesets

**Spec:** `docs/superpowers/specs/2026-03-24-phase2-production-ready.part-01.md` ~ `part-05.md`

---

## File Structure (New/Modified)

```
open-guardrail/
├── packages/
│   ├── core/package.json              # MODIFY: metadata
│   ├── guards/package.json            # MODIFY: metadata
│   ├── cli/package.json               # MODIFY: metadata
│   └── open-guardrail/
│       ├── package.json               # MODIFY: metadata
│       └── src/index.ts               # MODIFY: export all 26 guards
├── examples/
│   ├── basic-usage/
│   │   ├── package.json
│   │   ├── index.ts
│   │   └── README.md
│   ├── yaml-config/
│   │   ├── package.json
│   │   ├── guardrail.yaml
│   │   ├── index.ts
│   │   └── README.md
│   ├── custom-guard/
│   │   ├── package.json
│   │   ├── my-guard.ts
│   │   ├── index.ts
│   │   └── README.md
│   ├── with-express/
│   │   ├── package.json
│   │   ├── server.ts
│   │   └── README.md
│   ├── with-nextjs/
│   │   ├── package.json
│   │   ├── app/api/chat/route.ts
│   │   └── README.md
│   └── korean-compliance/
│       ├── package.json
│       ├── guardrail.yaml
│       ├── index.ts
│       └── README.md
├── presets/
│   ├── korean.yaml                    # NEW
│   ├── security.yaml                  # NEW
│   └── content.yaml                   # NEW
├── .github/
│   ├── workflows/ci.yaml             # MODIFY: add lint + coverage
│   ├── workflows/publish.yaml        # NEW
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md             # NEW
│   │   └── feature_request.md        # NEW
│   └── PULL_REQUEST_TEMPLATE.md      # NEW
├── CONTRIBUTING.md                    # NEW
├── SECURITY.md                        # NEW
├── .changeset/config.json             # NEW
└── README.md                          # MODIFY: update
```
