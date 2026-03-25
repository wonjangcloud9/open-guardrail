# open-guardrail

Open-source guardrail engine for LLM applications.

Provider-agnostic text input/output middleware. Works in Node.js, browsers, and edge runtimes.

[![npm](https://img.shields.io/npm/v/open-guardrail)](https://www.npmjs.com/package/open-guardrail)
[![license](https://img.shields.io/github/license/wonjangcloud9/open-guardrail)](LICENSE)
[![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)

**English** | [한국어](./README.ko.md)

> **Node.js >= 18** required

## Install

```bash
npm install open-guardrail
```

## Quick Start

```typescript
import { pipe, keyword, pii, promptInjection } from 'open-guardrail';

const result = await pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email', 'phone'], action: 'mask' }),
  keyword({ denied: ['hack', 'exploit'], action: 'block' }),
).run('user input text here');

if (!result.passed) {
  console.log('Blocked:', result.action);
}
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
npx open-guardrail-cli init          # create guardrail.yaml
npx open-guardrail-cli validate      # validate config
```

## Built-in Guards (38)

### Security
| Guard | Description |
|-------|-------------|
| `promptInjection` | Detect jailbreak and prompt injection attempts |
| `regex` | Custom pattern matching (ReDoS safe) |
| `keyword` | Deny/allow keyword lists |

### Privacy
| Guard | Description |
|-------|-------------|
| `pii` | Detect and mask PII (email, phone, card, SSN) |

### Content
| Guard | Description |
|-------|-------------|
| `toxicity` | Profanity, hate speech, threats, harassment detection |
| `topicDeny` | Block specific topics (politics, violence, etc.) |
| `topicAllow` | Only allow specified topics |
| `bias` | Gender, racial, religious, age bias detection |
| `language` | Restrict to allowed languages |

### Format
| Guard | Description |
|-------|-------------|
| `wordCount` | Min/max word/character limits |
| `schemaGuard` | JSON schema output validation |

### AI Delegation
| Guard | Description |
|-------|-------------|
| `llmJudge` | Delegate any judgment to external LLM |
| `hallucination` | Fact-check against source documents via LLM |
| `relevance` | Verify response relevance to question via LLM |
| `groundedness` | Verify RAG response grounding via LLM |

### Operational
| Guard | Description |
|-------|-------------|
| `costGuard` | Token usage and cost limits |
| `rateLimit` | Per-key request rate limiting |
| `dataLeakage` | System prompt and training data leak detection |
| `sentiment` | Emotional tone control |

### Agent Safety
| Guard | Description |
|-------|-------------|
| `toolCallValidator` | Validate tool call arguments (type safety, injection prevention, tool allowlist) |
| `codeSafety` | Detect dangerous code: eval, shell injection, SQL injection, env exposure |

### Content (Advanced)
| Guard | Description |
|-------|-------------|
| `copyright` | Detect copyright notices, trademarks, verbatim reproduction |
| `watermarkDetect` | Detect AI-generated text markers (disclosure phrases, hedging, formulaic) |
| `multiTurnContext` | Multi-turn manipulation: gradual jailbreak, topic drift, repetitive probing |
| `jsonRepair` | Repair malformed JSON output from LLMs |
| `urlGuard` | URL validation and filtering (allowlist/denylist, protocol checks) |
| `repetitionDetect` | Detect repetitive patterns in LLM output |
| `encodingAttack` | Detect base64/hex/unicode encoded injection attempts |
| `markdownSanitize` | Sanitize dangerous markdown and HTML (XSS prevention) |
| `responseQuality` | Check response quality: too short, repetitive, or refusal |
| `apiKeyDetect` | Detect leaked API keys, tokens, secrets (OpenAI, AWS, GitHub, Stripe, etc.) |
| `languageConsistency` | Verify response language matches expected language |

### Korea / ISMS
| Guard | Description |
|-------|-------------|
| `piiKr` | Korean PII (주민등록번호, 여권, 면허, 사업자등록번호 등) |
| `profanityKr` | Korean profanity (초성, 변형 포함) |
| `residentId` | Resident ID checksum validation + masking |
| `creditInfo` | Financial info protection (계좌, 카드, 신용등급) |
| `ismsP` | ISMS-P compliance preset |
| `pipa` | Personal Information Protection Act compliance |

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
| [with-hono](./examples/with-hono/) | Hono middleware (Edge/Workers/Deno/Bun) |
| [plugin-usage](./examples/plugin-usage/) | Creating and using guard plugins |

## Presets

| Preset | Use Case |
|--------|----------|
| `default` | Basic protection (prompt-injection, keyword, word-count) |
| `strict` | Full PII masking + strict blocking |
| `korean` | Korean compliance (ISMS-P, PIPA, 주민등록번호) |
| `security` | Injection, PII, data leakage focused |
| `content` | Toxicity, bias, language control |
| `ai-basic-act-kr` | 한국 AI 기본법 준수 (편향 방지, PII, 독성) |
| `eu-ai-act` | EU AI Act compliance (bias, PII, toxicity, watermark, copyright) |

## Packages

| Package | Description |
|---------|-------------|
| `open-guardrail` | All-in-one (core + 38 guards) |
| `open-guardrail-core` | Core engine only (Pipeline, StreamingPipeline, Router, AuditLogger) |
| `open-guardrail-guards` | Built-in guards only |
| `open-guardrail-cli` | CLI tools |
| `open-guardrail-openai` | OpenAI SDK adapter — guard chat completions |
| `open-guardrail-anthropic` | Anthropic (Claude) SDK adapter |
| `open-guardrail-express` | Express middleware adapter |
| `open-guardrail-fastify` | Fastify plugin adapter |
| `open-guardrail-hono` | Hono middleware (Edge/Workers/Deno/Bun) |
| `open-guardrail-vercel-ai` | Vercel AI SDK middleware adapter |
| `open-guardrail-langchain` | LangChain.js integration adapter |

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
- **Provider agnostic** — works with any LLM, any framework

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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## License

MIT
