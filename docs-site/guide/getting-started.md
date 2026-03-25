# Getting Started

## Installation

```bash
npm install open-guardrail
```

Or install only the parts you need:

```bash
npm install open-guardrail-core open-guardrail-guards
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

## How It Works

1. **Create guards** — each guard is a function that inspects text and returns `allow`, `block`, `warn`, or `override`
2. **Build a pipeline** — chain guards together with `pipe()` or `createPipeline()`
3. **Run text** — call `.run(text)` to get a `PipelineResult` with pass/fail, individual guard results, and optional transformed output

## Guard Actions

| Action | Meaning |
|--------|---------|
| `allow` | Text passed this guard |
| `block` | Text should be rejected |
| `warn` | Text passed but flagged |
| `override` | Text was modified (e.g., PII masking) |

## Pipeline Modes

- **fail-fast** (default) — stops at the first `block` result
- **run-all** — runs every guard, then picks the highest-priority action

## Result Structure

```typescript
interface PipelineResult {
  passed: boolean;           // true if not blocked
  action: GuardAction;       // highest-priority action
  results: GuardResult[];    // per-guard details
  input: string;             // original input
  output?: string;           // modified text (if any guard used override)
  totalLatencyMs: number;
  metadata: { ... };
}
```

## Next Steps

- [YAML Config](/guide/yaml-config) — configure guards without code
- [Guards Overview](/guards/overview) — browse all 33 built-in guards
- [SDK Adapters](/adapters/openai) — integrate with OpenAI, Vercel AI, LangChain
