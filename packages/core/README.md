# open-guardrail-core

[![npm](https://img.shields.io/npm/v/open-guardrail-core)](https://www.npmjs.com/package/open-guardrail-core) [![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)

Core engine for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail) — the open-source guardrail engine for LLM applications.

[![npm](https://img.shields.io/npm/v/open-guardrail-core)](https://www.npmjs.com/package/open-guardrail-core)

## Install

```bash
npm install open-guardrail-core
```

## What's Included

- **Pipeline** — Guard chaining with fail-fast / run-all modes, timeout, dry-run
- **StreamingPipeline** — Chunk-level guard validation for LLM streaming responses
- **GuardRouter** — Risk-based routing to different guard pipelines
- **AuditLogger** — Compliance logging (EU AI Act, Korean AI Basic Act)
- **EventBus** — guard:before, guard:after, guard:blocked, guard:error hooks
- **OpenGuardrail** — Config-driven engine (YAML/JSON to Pipeline)
- **GuardRegistry** — Dynamic guard type resolution
- **Config Loader** — YAML/JSON parsing + Zod schema validation

## Usage

```typescript
import { createPipeline, pipe } from 'open-guardrail-core';
import type { Guard } from 'open-guardrail-core';

// Programmatic
const pipeline = createPipeline({
  guards: [myGuard1, myGuard2],
  mode: 'fail-fast',
});
const result = await pipeline.run('user input');

// Streaming
const sp = new StreamingPipeline({ guards: [myGuard] });
const result = await sp.runStream(asyncStream, { onChunk: console.log });

// Risk routing
const router = new GuardRouter({
  classifier: (text) => text.length < 20 ? 'low' : 'high',
  routes: { low: fastPipeline, high: strictPipeline },
});
```

## Use with guards

For built-in guards, install `open-guardrail-guards` or the all-in-one `open-guardrail` package.

## License

MIT
