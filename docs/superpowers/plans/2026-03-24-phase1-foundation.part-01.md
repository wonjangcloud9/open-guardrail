# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core guardrail engine with pipeline, config loader, event system, 6 built-in guards, CLI, and publish to npm as v0.1.0.

**Architecture:** Monorepo with pnpm workspaces + turborepo. Core engine exposes Pipeline, Guard interface, EventBus, and Config Loader. Guards are independent modules that implement the Guard interface. CLI wraps core for project init and config validation.

**Tech Stack:** TypeScript (strict), pnpm, turborepo, tsup, vitest, zod, yaml, safe-regex2

**Spec:** `docs/superpowers/specs/2026-03-24-open-guardrail-design.part-01.md` ~ `part-07.md`

---

## File Structure

```
open-guardrail/
├── .gitignore
├── .npmrc
├── package.json              # root workspace
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json        # shared TS config
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── src/
│   │   │   ├── index.ts           # public API re-exports
│   │   │   ├── types.ts           # Guard, GuardResult, PipelineResult, etc.
│   │   │   ├── pipeline.ts        # Pipeline class + pipe() + createPipeline()
│   │   │   ├── event-bus.ts       # EventBus class
│   │   │   ├── config-loader.ts   # YAML/JSON → Pipeline (Node only)
│   │   │   ├── config-schema.ts   # Zod schemas for config validation
│   │   │   └── errors.ts          # GuardError, ConfigError
│   │   └── tests/
│   │       ├── pipeline.test.ts
│   │       ├── event-bus.test.ts
│   │       ├── config-loader.test.ts
│   │       └── errors.test.ts
│   ├── guards/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── src/
│   │   │   ├── index.ts           # re-exports all guards
│   │   │   ├── regex.ts
│   │   │   ├── keyword.ts
│   │   │   ├── pii.ts
│   │   │   ├── prompt-injection.ts
│   │   │   ├── word-count.ts
│   │   │   └── schema-guard.ts
│   │   └── tests/
│   │       ├── regex.test.ts
│   │       ├── keyword.test.ts
│   │       ├── pii.test.ts
│   │       ├── prompt-injection.test.ts
│   │       ├── word-count.test.ts
│   │       └── schema-guard.test.ts
│   └── cli/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       ├── src/
│       │   ├── index.ts           # CLI entry (bin)
│       │   ├── commands/
│       │   │   ├── init.ts
│       │   │   └── validate.ts
│       │   └── templates/
│       │       ├── default.yaml
│       │       └── strict.yaml
│       └── tests/
│           ├── init.test.ts
│           └── validate.test.ts
├── presets/
│   ├── default.yaml
│   └── strict.yaml
└── packages/open-guardrail/     # umbrella package
    ├── package.json
    ├── tsconfig.json
    ├── tsup.config.ts
    └── src/
        └── index.ts              # re-exports core + guards
```
