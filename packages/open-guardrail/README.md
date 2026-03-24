# open-guardrail

Open-source guardrail engine for LLM applications.

Provider-agnostic text input/output middleware. Works in Node.js, browsers, and edge runtimes.

[![npm](https://img.shields.io/npm/v/open-guardrail)](https://www.npmjs.com/package/open-guardrail)
[![license](https://img.shields.io/github/license/wonjangcloud9/open-guardrail)](https://github.com/wonjangcloud9/open-guardrail/blob/main/LICENSE)

## Install

```bash
npm install open-guardrail
```

## Quick Start

```typescript
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';

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
```

```typescript
import { OpenGuardrail } from 'open-guardrail';
const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
const result = await engine.run(text);
```

## 30 Built-in Guards

| Category | Guards |
|----------|--------|
| **Security** | promptInjection, regex, keyword |
| **Privacy** | pii |
| **Content** | toxicity, topicDeny, topicAllow, bias, language |
| **Format** | wordCount, schemaGuard |
| **AI Delegation** | llmJudge, hallucination, relevance, groundedness |
| **Operational** | costGuard, rateLimit, dataLeakage, sentiment |
| **Agent Safety** | toolCallValidator, codeSafety |
| **Advanced** | copyright, watermarkDetect, multiTurnContext |
| **Korea/ISMS** | piiKr, profanityKr, residentId, creditInfo, ismsP, pipa |

## Key Features

- **StreamingPipeline** — chunk-level real-time guard validation
- **GuardRouter** — risk-based pipeline routing (low/medium/high)
- **AuditLogger** — EU AI Act / Korean AI Basic Act compliance logging
- **Vercel AI SDK** — middleware adapter (`open-guardrail-vercel-ai`)
- **8 Presets** — default, strict, korean, security, content, ai-basic-act-kr, eu-ai-act
- **Event hooks** — guard:before, guard:after, guard:blocked, guard:error
- **Dry run mode** — test guards without blocking
- **Provider agnostic** — works with any LLM, any framework

## Packages

| Package | Description |
|---------|-------------|
| [`open-guardrail`](https://www.npmjs.com/package/open-guardrail) | All-in-one (core + 30 guards) |
| [`open-guardrail-core`](https://www.npmjs.com/package/open-guardrail-core) | Core engine only |
| [`open-guardrail-guards`](https://www.npmjs.com/package/open-guardrail-guards) | Guards only |
| [`open-guardrail-cli`](https://www.npmjs.com/package/open-guardrail-cli) | CLI tools |
| [`open-guardrail-vercel-ai`](https://www.npmjs.com/package/open-guardrail-vercel-ai) | Vercel AI SDK adapter |

## License

MIT
