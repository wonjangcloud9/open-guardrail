# open-guardrail

Open-source guardrail engine for LLM applications.

Provider-agnostic text input/output middleware. Works in Node.js, browsers, and edge runtimes.

[![npm](https://img.shields.io/npm/v/open-guardrail)](https://www.npmjs.com/package/open-guardrail)
[![license](https://img.shields.io/github/license/wonjangcloud9/open-guardrail)](LICENSE)
[![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)

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

## Built-in Guards (25)

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

## Presets

| Preset | Use Case |
|--------|----------|
| `default` | Basic protection (prompt-injection, keyword, word-count) |
| `strict` | Full PII masking + strict blocking |
| `korean` | Korean compliance (ISMS-P, PIPA, 주민등록번호) |
| `security` | Injection, PII, data leakage focused |
| `content` | Toxicity, bias, language control |

## Packages

| Package | Description |
|---------|-------------|
| `open-guardrail` | All-in-one (core + 25 guards) |
| `open-guardrail-core` | Core engine only (Pipeline, Guard IF, EventBus) |
| `open-guardrail-guards` | Built-in guards only |
| `open-guardrail-cli` | CLI tools |

## Features

- **Pipeline chaining** — compose guards with `pipe()` or `createPipeline()`
- **Declarative config** — YAML/JSON configuration, no code changes needed
- **Event hooks** — `guard:before`, `guard:after`, `guard:blocked`, `guard:error`
- **Dry run mode** — test guards without blocking
- **Fail-fast / Run-all** — choose execution strategy per pipeline
- **Error handling** — configurable fail-closed/open with timeouts
- **Provider agnostic** — works with any LLM, any framework

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## License

MIT
