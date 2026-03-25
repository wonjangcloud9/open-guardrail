# open-guardrail-anthropic

[![npm](https://img.shields.io/npm/v/open-guardrail-anthropic)](https://www.npmjs.com/package/open-guardrail-anthropic) [![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)

Anthropic SDK adapter for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail).

Guard messages inputs and outputs with zero config changes.

## Install

```bash
npm install open-guardrail-anthropic open-guardrail @anthropic-ai/sdk
```

## Quick Start

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { pipe, promptInjection, pii } from 'open-guardrail';
import { createGuardedAnthropic } from 'open-guardrail-anthropic';

const anthropic = new Anthropic();

const guarded = createGuardedAnthropic(anthropic, {
  input: pipe(promptInjection({ action: 'block' })),
  output: pipe(pii({ entities: ['email'], action: 'mask' })),
});

// Use exactly like the normal Anthropic client
const res = await guarded.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

## Low-Level API

```typescript
import { guardedMessages } from 'open-guardrail-anthropic';

const safeCreate = guardedMessages(
  anthropic.messages.create.bind(anthropic.messages),
  { input: myInputPipeline, output: myOutputPipeline },
);

const res = await safeCreate({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages,
});
```

## Error Handling

```typescript
import { GuardrailBlockedError } from 'open-guardrail-anthropic';

try {
  await guarded.messages.create({ ... });
} catch (err) {
  if (err instanceof GuardrailBlockedError) {
    console.log(err.stage);  // 'input' | 'output'
    console.log(err.result); // PipelineResult
  }
}
```

## License

MIT
