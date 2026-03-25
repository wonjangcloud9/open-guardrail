# Release v1.2.0

## Highlights

- **38 built-in guards** (+8 from v1.1.0)
- **8 SDK adapters** (+7 new)
- **Guard composition utilities** — `when`, `compose`, `not`, `retry`, `fallback`
- **`defineGuardrail()`** — one-line guardrail setup
- **Plugin system** — community guard packages
- **Debug mode** — log guard execution to console
- **VitePress docs site** — 36 pages (English + Korean)
- **Web playground** — interactive browser-based guard tester
- **Performance benchmarks** — 28 benchmarks, <0.1ms pipeline latency

## New Guards

| Guard | Category | Description |
|-------|----------|-------------|
| `encodingAttack` | Security | Base64/hex/unicode encoded injection detection |
| `markdownSanitize` | Security | XSS prevention via markdown sanitization |
| `apiKeyDetect` | Security | Leaked API key/token/secret detection (10 providers) |
| `responseQuality` | Content | Too short, repetitive, or refusal detection |
| `languageConsistency` | Content | Response language verification (7 languages) |
| `jsonRepair` | Format | Repair malformed LLM JSON output |
| `urlGuard` | Content | URL validation and filtering |
| `repetitionDetect` | Content | Repetitive pattern detection |

## New Adapters

| Package | Framework |
|---------|-----------|
| `open-guardrail-openai` | OpenAI SDK |
| `open-guardrail-anthropic` | Anthropic (Claude) SDK |
| `open-guardrail-nextjs` | Next.js App Router |
| `open-guardrail-express` | Express |
| `open-guardrail-fastify` | Fastify |
| `open-guardrail-hono` | Hono (Edge/Workers/Deno/Bun) |
| `open-guardrail-langchain` | LangChain.js |

## New APIs

### `defineGuardrail()` — Simplest API

```typescript
import { defineGuardrail, promptInjection, pii } from 'open-guardrail';

const guard = defineGuardrail({
  guards: [
    promptInjection({ action: 'block' }),
    pii({ entities: ['email'], action: 'mask' }),
  ],
});

const result = await guard('user input');
```

### Guard Composition

```typescript
import { compose, when, retry, fallback } from 'open-guardrail';

const security = compose('security', promptInjection(...), keyword(...));
const longOnly = when((text) => text.length > 200, toxicity(...));
const reliable = retry(llmJudge(...), { maxRetries: 2 });
const safe = fallback(llmJudge(...), keyword(...));
```

### Plugin System

```typescript
registry.use({
  meta: { name: 'my-plugin', version: '1.0.0', description: '...' },
  guards: { 'my-guard': (config) => myGuard(config) },
});
```

## Stats

- **159 files changed**, +11,888 lines
- **427 tests** passing
- **26 packages**
- **36 documentation pages**
- **11 examples**
- **28 benchmarks**
- Core coverage: 91% statements
- Guards coverage: 98.7% statements

## How to Upgrade

```bash
npm install open-guardrail@1.2.0
```

## Full Changelog

See [CHANGELOG.md](./CHANGELOG.md)
