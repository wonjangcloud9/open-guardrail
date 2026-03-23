# open-guardrail

Open-source guardrail engine for LLM applications.

Provider-agnostic text input/output middleware. Works in Node.js, browsers, and edge runtimes.

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
```

Then load it:

```typescript
import { OpenGuardrail } from 'open-guardrail';

const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
const result = await engine.run(text);
```

## CLI

```bash
npx @open-guardrail/cli init          # create guardrail.yaml
npx @open-guardrail/cli validate      # validate config
```

## Built-in Guards

| Guard | Description |
|-------|-------------|
| `prompt-injection` | Detect jailbreak attempts |
| `regex` | Custom pattern matching (ReDoS safe) |
| `keyword` | Deny/allow keyword lists |
| `pii` | Detect and mask PII (email, phone, card, SSN) |
| `word-count` | Min/max word/char limits |
| `schema` | JSON schema validation |

## Packages

| Package | Description |
|---------|-------------|
| `open-guardrail` | All-in-one (core + guards) |
| `@open-guardrail/core` | Core engine only |
| `@open-guardrail/guards` | Built-in guards only |
| `@open-guardrail/cli` | CLI tools |

## License

MIT
