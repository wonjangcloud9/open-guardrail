## npm Package Metadata — Target State

### 공통 필드 (전 패키지)

```json
{
  "author": "Lucas <wonjangcloud9@gmail.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/wonjangcloud9/open-guardrail",
    "directory": "packages/<name>"
  },
  "bugs": "https://github.com/wonjangcloud9/open-guardrail/issues",
  "homepage": "https://github.com/wonjangcloud9/open-guardrail",
  "engines": { "node": ">=18" },
  "keywords": [/* 패키지별 */]
}
```

### 패키지별 description + keywords

| Package | Description | Keywords |
|---------|-------------|----------|
| open-guardrail | Open-source guardrail engine for LLM apps — 25 built-in guards, pipeline chaining, YAML config | guardrail, llm, ai, safety, moderation, pii, prompt-injection, content-filter, compliance |
| open-guardrail-core | Core engine: Pipeline, Guard interface, EventBus, Config Loader — provider agnostic | guardrail, llm, pipeline, guard, event-bus, config, middleware |
| open-guardrail-guards | 25 built-in guards: security, privacy, content, format, AI delegation, Korean compliance | guardrail, pii, toxicity, bias, prompt-injection, isms-p, pipa, hallucination |
| open-guardrail-cli | CLI for open-guardrail — init project, validate config, preset scaffolding | guardrail, cli, llm, config, yaml |
