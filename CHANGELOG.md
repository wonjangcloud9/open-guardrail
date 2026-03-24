# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] — 2026-03-24

### Added — Core Engine
- `Pipeline` with fail-fast / run-all modes, timeout, dry-run
- `StreamingPipeline` with chunk-level guard validation + full-text semantic checks
- `GuardRouter` for risk-based pipeline routing (low/medium/high)
- `AuditLogger` for EU AI Act / Korean AI Basic Act compliance
- `EventBus` with guard:before, guard:after, guard:blocked, guard:error hooks
- `OpenGuardrail` config-driven engine (YAML/JSON → Pipeline)
- `GuardRegistry` for dynamic guard type resolution
- Config Loader with Zod schema validation

### Added — Guards (30)

**Security:** promptInjection, regex, keyword
**Privacy:** pii
**Content:** toxicity, topicDeny, topicAllow, bias, language
**Format:** wordCount, schemaGuard
**AI Delegation:** llmJudge, hallucination, relevance, groundedness
**Operational:** costGuard, rateLimit, dataLeakage, sentiment
**Agent Safety:** toolCallValidator, codeSafety
**Advanced:** copyright, watermarkDetect, multiTurnContext
**Korea / ISMS:** piiKr, profanityKr, residentId, creditInfo, ismsP, pipa

### Added — Adapters
- `open-guardrail-vercel-ai` — Vercel AI SDK middleware adapter

### Added — Presets (8)
- default, strict, korean, security, content
- ai-basic-act-kr (Korean AI Basic Act)
- eu-ai-act (EU AI Act)

### Added — Examples (6)
- basic-usage, yaml-config, custom-guard
- with-express, with-nextjs, korean-compliance

### Added — Infrastructure
- CONTRIBUTING.md, SECURITY.md
- GitHub issue/PR templates
- CI: Node 18/20/22 matrix
- Publish workflow (tag-triggered npm publish)
- CLI: init, validate commands

## [0.9.0] — 2026-03-24

- Add multiTurnContext guard (gradual jailbreak, topic drift)
- Add watermarkDetect guard (AI text markers)
- Add EU AI Act preset

## [0.8.0] — 2026-03-24

- Add Vercel AI SDK middleware adapter
- Add copyright detection guard
- Add code-safety guard

## [0.7.0] — 2026-03-24

- Add StreamingPipeline
- Add tool-call-validator guard
- Add AuditLogger
- Add GuardRouter
- Add Korean AI Basic Act preset

## [0.5.0] — 2026-03-24

- Export all 26 guards from umbrella package
- Add npm metadata to all packages
- Add 6 examples
- Add korean, security, content presets
- Add CONTRIBUTING.md, SECURITY.md
- Add publish workflow

## [0.3.0] — 2026-03-24

- Add operational guards (costGuard, rateLimit, dataLeakage, sentiment)
- Add AI delegation guards (llmJudge, hallucination, relevance, groundedness)

## [0.2.0] — 2026-03-24

- Add content guards (toxicity, topicDeny, topicAllow, bias, language)
- Add Korea locale guards (piiKr, profanityKr, residentId, creditInfo, ismsP, pipa)

## [0.1.0] — 2026-03-24

- Initial release
- Core engine: Pipeline, EventBus, Config Loader, Guard Registry
- 6 built-in guards: regex, keyword, pii, promptInjection, wordCount, schemaGuard
- CLI: init, validate
- Presets: default, strict
