# open-guardrail

**67 guards. 8 languages. <0.1ms latency. Zero vendor lock-in.**

The most comprehensive open-source guardrail engine for LLM applications. Block prompt injection, mask PII in 8 regions, detect toxicity in 4 languages — all without external API calls.

[![npm](https://img.shields.io/npm/v/open-guardrail)](https://www.npmjs.com/package/open-guardrail)
[![PyPI](https://img.shields.io/pypi/v/open-guardrail)](https://pypi.org/project/open-guardrail/)
[![license](https://img.shields.io/github/license/wonjangcloud9/open-guardrail)](LICENSE)
[![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)
![guards](https://img.shields.io/badge/guards-67-blue)
![adapters](https://img.shields.io/badge/adapters-8-green)
![tests](https://img.shields.io/badge/tests-653-brightgreen)
![PII languages](https://img.shields.io/badge/PII_languages-8-orange)

**English** | [한국어](./README.ko.md) | [Documentation](https://wonjangcloud9.github.io/open-guardrail/)

> Works in **Node.js**, **Python**, browsers, and edge runtimes. No external APIs required.

## Why open-guardrail?

- **67 guards** — from prompt injection to GDPR compliance, all pattern-based (no ML model needed)
- **8 PII regions** — EN, KO, JA, ZH, TH, AR, HI, EU with checksum validation
- **<0.1ms** — 6-guard pipeline in under 0.1ms. 50,000x cheaper than API-based alternatives
- **Both JS and Python** — same guards, same API, same coverage
- **14 presets** — GDPR, healthcare, finance, Korean/Japanese/Chinese compliance, full-security
- **Zero dependencies** — no external APIs, no ML models, no vendor lock-in
- **Custom guard builder** — create your own guards in 3 lines of code

## Install

**TypeScript / JavaScript:**

```bash
npm install open-guardrail
```

**Python:**

```bash
pip install open-guardrail
```

## Quick Start

```typescript
import { defineGuardrail, promptInjection, pii, keyword } from 'open-guardrail';

const guard = defineGuardrail({
  guards: [
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
    keyword({ denied: ['hack', 'exploit'], action: 'block' }),
  ],
});

const result = await guard('user input text here');
if (!result.passed) console.log('Blocked:', result.action);
// result.output contains masked text when PII is detected
```

**Python:**

```python
from open_guardrail import pipe, prompt_injection, pii, keyword

pipeline = pipe(
    prompt_injection(action="block"),
    pii(entities=["email", "phone"], action="mask"),
    keyword(denied=["hack", "exploit"], action="block"),
)

result = pipeline.run("user input text here")
if not result.passed:
    print(f"Blocked: {result.action} - {result.results[0].message}")
```

Or use the `pipe()` shorthand (TypeScript):

```typescript
import { pipe, promptInjection, pii } from 'open-guardrail';

const result = await pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email'], action: 'mask' }),
).run('user input');
```

## YAML Config

Create `guardrail.yaml`:

```yaml
version: "1"
pipelines:
  input:
    mode: fail-fast
    guards:
      - type: prompt-injection
        action: block
      - type: pii
        action: mask
        config:
          entities: [email, phone]
  output:
    mode: run-all
    guards:
      - type: toxicity
        action: warn
      - type: hallucination
        action: block
```

Then load it:

```typescript
import { OpenGuardrail } from 'open-guardrail';

const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
const result = await engine.run(text);
```

## CLI

```bash
npx open-guardrail-cli init              # create guardrail.yaml
npx open-guardrail-cli validate          # validate config
npx open-guardrail-cli list              # list all 67 guards
npx open-guardrail-cli list security     # filter by category
npx open-guardrail-cli list --language=ko  # filter by language
npx open-guardrail-cli test              # test against sample inputs
npx open-guardrail-cli test guardrail.yaml tests.json  # custom test file
```

## Built-in Guards (67)

### Security (18)
| Guard | Description |
|-------|-------------|
| `promptInjection` | Detect jailbreak and prompt injection attempts |
| `sqlInjection` | SQL injection detection (3 sensitivity levels) |
| `xssGuard` | Cross-site scripting detection + sanitize mode |
| `codeSafety` | Dangerous code patterns (eval, shell, SQL injection) |
| `encodingAttack` | Base64/hex/unicode encoded injection detection |
| `invisibleText` | Zero-width/bidi/BOM invisible character detection |
| `dataLeakage` | System prompt and training data leak detection |
| `canaryToken` | Detect system prompt leakage via embedded tokens |
| `markdownSanitize` | Dangerous markdown/HTML sanitization |
| `multiTurnContext` | Multi-turn manipulation and jailbreak detection |
| `urlGuard` | URL validation, phishing, private IP detection |
| `ipGuard` | IP address detection with allow/deny lists + masking |
| `apiKeyDetect` | Leaked API keys (OpenAI, AWS, GitHub, Stripe, etc.) |
| `secretPattern` | Credentials, connection strings, private keys, webhooks |
| `keyword` | Deny/allow keyword lists |
| `regex` | Custom pattern matching (ReDoS safe) |
| `rateLimit` | Sliding window rate limiter |
| `toolCallValidator` | Agent tool call argument validation |

### Privacy (12)
| Guard | Description | Language |
|-------|-------------|----------|
| `pii` | Email, phone, SSN, passport, ITIN, Medicare | EN |
| `piiKr` | 주민등록번호, 여권, 면허, 사업자등록번호, 건강보험, 외국인등록 | KO |
| `piiJp` | マイナンバー (checksum), パスポート, 運転免許, 法人番号, 口座, 健康保険 | JA |
| `piiCn` | 身份证 (checksum+region), 护照, 银行卡, 社保号, 手机号 | ZH |
| `piiTh` | บัตรประชาชน (checksum), หนังสือเดินทาง, เบอร์โทร, บัญชีธนาคาร | TH |
| `piiAr` | الهوية, جواز السفر, الهاتف, IBAN | AR |
| `piiIn` | Aadhaar, PAN, passport, phone, IFSC | HI |
| `piiEu` | IBAN, VAT (10 countries), UK NINO, NL BSN, ES NIF, IT Codice Fiscale, PL PESEL | EU |
| `residentId` | Korean resident ID checksum + masking | KO |
| `creditInfo` | Korean financial info (계좌, 카드, 신용등급) | KO |
| `phoneFormat` | International phone detection (US/KR/JP/CN/UK) | * |
| `deanonymize` | Detect leaked PII mask labels in output | * |

### Content (14)
| Guard | Description |
|-------|-------------|
| `toxicity` | Profanity, hate speech, threats, harassment |
| `profanityKr` | Korean profanity (초성, 변형 포함) |
| `profanityJp` | Japanese profanity (ひらがな/カタカナ/漢字 + variants) |
| `profanityCn` | Chinese profanity (pinyin abbreviations + variants) |
| `bias` | Gender, racial, religious, age bias detection |
| `sentiment` | Emotional tone analysis |
| `noRefusal` | Detect LLM refusal responses |
| `banCode` | Detect/block code blocks (7 languages) |
| `banSubstring` | Ban specific substrings |
| `competitorMention` | Detect competitor brand mentions |
| `emailValidator` | Email validation + disposable domain detection |
| `gibberishDetect` | Detect nonsensical/random input |
| `readability` | Flesch Reading Ease score validation |
| `readingTime` | Estimate and limit reading time |

### Locale / Regulatory (6)
| Guard | Description |
|-------|-------------|
| `language` | Language detection and filtering (11+ languages) |
| `languageConsistency` | Verify response language matches expected |
| `ismsP` | ISMS-P compliance (Korean infosec certification) |
| `pipa` | PIPA compliance (Korean Personal Information Protection) |
| `appi` | APPI compliance (Japanese Personal Information Protection) |
| `pipl` | PIPL compliance (Chinese Personal Information Protection) |

### Format (9)
| Guard | Description |
|-------|-------------|
| `wordCount` | Word/character count limits |
| `contentLength` | Validate by chars/words/sentences |
| `tokenLimit` | Token count estimation (3 methods) |
| `schemaGuard` | JSON Schema output validation |
| `jsonRepair` | Repair malformed JSON from LLMs |
| `repetitionDetect` | Detect repetitive LLM output |
| `validRange` | Validate numbers within min/max bounds |
| `validChoice` | Validate text is from allowed choices |
| `singleLine` | Validate output is a single line |
| `caseValidation` | Validate upper/lower/title/sentence case |

### AI Delegation (4)
| Guard | Description |
|-------|-------------|
| `llmJudge` | Custom LLM evaluation |
| `hallucination` | Source verification for hallucinated content |
| `relevance` | Response relevance checking via LLM |
| `groundedness` | RAG groundedness evaluation |

### Operational (4)
| Guard | Description |
|-------|-------------|
| `costGuard` | Token usage and cost limits |
| `copyright` | Copyright and trademark detection |
| `watermarkDetect` | AI-generated text markers |
| `responseQuality` | Response quality validation |

## Examples

| Example | Description |
|---------|-------------|
| [basic-usage](./examples/basic-usage/) | `pipe()` with prompt-injection, PII masking, keyword blocking |
| [yaml-config](./examples/yaml-config/) | Config-driven guardrail with `guardrail.yaml` |
| [custom-guard](./examples/custom-guard/) | Creating a custom guard implementing Guard interface |
| [with-express](./examples/with-express/) | Express middleware integration |
| [with-nextjs](./examples/with-nextjs/) | Next.js App Router API route |
| [korean-compliance](./examples/korean-compliance/) | 한국 규제 준수 (ISMS-P, PIPA) |
| [with-openai](./examples/with-openai/) | OpenAI SDK with guardrails |
| [with-anthropic](./examples/with-anthropic/) | Anthropic (Claude) SDK with guardrails |
| [with-fastify](./examples/with-fastify/) | Fastify plugin with guardrails |
| [with-hono](./examples/with-hono/) | Hono middleware (Edge/Workers/Deno/Bun) |
| [plugin-usage](./examples/plugin-usage/) | Creating and using guard plugins |

## Presets (11)

| Preset | Use Case |
|--------|----------|
| `default` | Basic protection (prompt-injection, keyword, word-count) |
| `strict` | Full PII masking + strict blocking |
| `korean` | Korean compliance (ISMS-P, PIPA, 주민등록번호) |
| `japanese` | Japanese compliance (APPI, マイナンバー, profanity) |
| `chinese` | Chinese compliance (PIPL, 身份证, profanity) |
| `security` | Injection, PII, data leakage focused |
| `full-security` | Comprehensive attack prevention (SQL/XSS/encoding/leakage/secrets) |
| `privacy-first` | Multi-language PII masking (EN/KR/JP/CN), secrets, emails, IPs |
| `content` | Toxicity, bias, language control |
| `ai-basic-act-kr` | 한국 AI 기본법 준수 (편향 방지, PII, 독성) |
| `eu-ai-act` | EU AI Act compliance (bias, PII, toxicity, watermark, copyright) |

## Packages

| Package | Description |
|---------|-------------|
| `open-guardrail` | All-in-one (core + 67 guards) |
| `open-guardrail-core` | Core engine only (Pipeline, StreamingPipeline, Router, AuditLogger) |
| `open-guardrail-guards` | Built-in guards only |
| `open-guardrail-cli` | CLI tools |
| `open-guardrail-openai` | OpenAI SDK adapter — guard chat completions |
| `open-guardrail-anthropic` | Anthropic (Claude) SDK adapter |
| `open-guardrail-express` | Express middleware adapter |
| `open-guardrail-fastify` | Fastify plugin adapter |
| `open-guardrail-hono` | Hono middleware (Edge/Workers/Deno/Bun) |
| `open-guardrail-nextjs` | Next.js App Router adapter |
| `open-guardrail-vercel-ai` | Vercel AI SDK middleware adapter |
| `open-guardrail-langchain` | LangChain.js integration adapter |

## Guard Composition

```typescript
import { pipe, compose, when, not, promptInjection, keyword, pii, toxicity } from 'open-guardrail';

// Bundle guards into a reusable unit
const securityBundle = compose('security',
  promptInjection({ action: 'block' }),
  keyword({ denied: ['hack', 'exploit'], action: 'block' }),
);

// Conditional guard — only run toxicity check on long text
const longTextToxicity = when(
  (text) => text.length > 200,
  toxicity({ action: 'block' }),
);

const pipeline = pipe(securityBundle, longTextToxicity, pii({ entities: ['email'], action: 'mask' }));
```

### Advanced Utilities

```typescript
import { retry, fallback, circuitBreaker, guardCache, parallel } from 'open-guardrail';

// Retry flaky LLM guards
const reliableJudge = retry(llmJudge({ ... }), { maxRetries: 2 });

// Fallback to local guard when LLM fails
const safe = fallback(llmJudge({ ... }), keyword({ denied: [...] }));

// Skip guard after 3 failures, auto-recover
const resilient = circuitBreaker(llmJudge({ ... }), { failureThreshold: 3 });

// Cache results for identical inputs
const cached = guardCache(llmJudge({ ... }), { ttlMs: 60_000 });

// Run guards in parallel for speed
const fast = parallel([promptInjection({ ... }), toxicity({ ... })], { mode: 'race-block' });
```

### Custom Guard Builder

```typescript
import { createCustomGuard, createKeywordGuard, createRegexGuard } from 'open-guardrail';

// Minimal custom guard
const noEmoji = createCustomGuard({ name: 'no-emoji' }, (text) => ({
  guardName: 'no-emoji',
  passed: !/\p{Emoji}/u.test(text),
  action: /\p{Emoji}/u.test(text) ? 'block' : 'allow',
  latencyMs: 0,
}));

// Keyword guard factory
const brandSafety = createKeywordGuard({
  name: 'brand-safety', action: 'block', denied: ['competitor-x'],
});

// Regex guard with masking
const orderMask = createRegexGuard({
  name: 'order-mask', action: 'mask', patterns: [/ORD-\d{6}/g], maskLabel: '[ORDER]',
});
```

## Features

- **Pipeline chaining** — compose guards with `pipe()` or `createPipeline()`
- **Streaming validation** — chunk-level guards + full-text semantic checks via `StreamingPipeline`
- **Risk-based routing** — route to different guard pipelines based on input risk level via `GuardRouter`
- **Agent safety** — validate tool call arguments with `toolCallValidator` (email, uuid, SQL injection)
- **Audit logging** — EU AI Act / 한국 AI 기본법 compliance via `AuditLogger`
- **Declarative config** — YAML/JSON configuration, no code changes needed
- **Event hooks** — `guard:before`, `guard:after`, `guard:blocked`, `guard:error`
- **Dry run mode** — test guards without blocking
- **Fail-fast / Run-all** — choose execution strategy per pipeline
- **Error handling** — configurable fail-closed/open with timeouts
- **Guard composition** — `compose()`, `when()`, `not()` for reusable guard bundles
- **Plugin system** — community guard packages via `registry.use(plugin)`
- **Debug mode** — `debug: true` logs every guard execution to console
- **Provider agnostic** — works with any LLM, any framework

## Why open-guardrail?

| Feature | open-guardrail | Guardrails AI | NeMo Guardrails | LLM Guard |
|---------|:-:|:-:|:-:|:-:|
| Language | TypeScript/JS | Python | Python | Python |
| Built-in guards | **67** | 50+ | 10+ | 30+ |
| PII languages | **7** (EN/KO/JA/ZH/TH/AR/HI+EU) | 1 | 1 | 1 |
| No external API needed | ✅ | ❌ | ❌ | Partial |
| Edge/browser runtime | ✅ | ❌ | ❌ | ❌ |
| Streaming validation | ✅ | ❌ | ❌ | ❌ |
| Parallel execution | ✅ `parallel()` | ❌ | ✅ | ❌ |
| Circuit breaker | ✅ | ❌ | ❌ | ❌ |
| Result caching | ✅ `guardCache()` | ❌ | ✅ LFU | ❌ |
| Guard composition | ✅ `compose` `when` `not` `retry` `fallback` | ❌ | ❌ | ❌ |
| Custom guard builder | ✅ 3 factory functions | ❌ | ❌ | ❌ |
| Metrics collector | ✅ `GuardMetrics` | ❌ | ❌ | ❌ |
| Plugin system | ✅ | ❌ | ❌ | ❌ |
| YAML config | ✅ | ✅ | ✅ (Colang) | ❌ |
| CLI tools | ✅ init/validate/list/test | ❌ | ❌ | ❌ |
| Asian compliance | ✅ ISMS-P, PIPA, APPI, PIPL | ❌ | ❌ | ❌ |
| SDK adapters | **8** | 1 | 1 | 1 |
| Latency (6-guard) | **<0.1ms** | 100ms+ | 100ms+ | 50ms+ |
| License | MIT | Apache 2.0 | Apache 2.0 | MIT |

## Playground

Try guards interactively in your browser — no backend required:

```bash
pnpm playground
```

Select guards, paste text, and see results in real time. Supports sample inputs for prompt injection, PII, toxic content, and Korean PII.

## Benchmarks

Single guard and pipeline throughput on Apple M-series (Node.js 22):

| Benchmark | ops/s | avg latency |
|-----------|------:|------------:|
| `keyword` — short text | 1,900,000 | <0.001ms |
| `regex` — short text | 2,700,000 | <0.001ms |
| `promptInjection` — short text | 1,300,000 | 0.001ms |
| `pii(mask)` — PII text | 408,000 | 0.002ms |
| `piiKr(mask)` — korean PII | 810,000 | 0.001ms |
| `toxicity` — toxic text | 152,000 | 0.007ms |
| **pipeline(6 guards)** — short text | 48,000 | 0.021ms |
| **pipeline(6 guards)** — long mixed | 14,000 | 0.071ms |

Run benchmarks locally:

```bash
pnpm bench
```

## Documentation

Full documentation with guides, API reference, and examples:

- [Getting Started Guide](https://wonjangcloud9.github.io/open-guardrail/guide/getting-started.html)
- [Guard Reference](https://wonjangcloud9.github.io/open-guardrail/guide/guards.html)
- [YAML Configuration](https://wonjangcloud9.github.io/open-guardrail/guide/yaml-config.html)
- [Custom Guards](https://wonjangcloud9.github.io/open-guardrail/guide/custom-guards.html)
- [Streaming Pipeline](https://wonjangcloud9.github.io/open-guardrail/guide/streaming.html)
- [Audit Logging](https://wonjangcloud9.github.io/open-guardrail/guide/audit-logging.html)
- [Korean Guide (한국어)](https://wonjangcloud9.github.io/open-guardrail/ko/)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## Sponsors

If open-guardrail is useful to your company, consider [sponsoring on GitHub](https://github.com/sponsors/wonjangcloud9) to support continued development.

## License

MIT
