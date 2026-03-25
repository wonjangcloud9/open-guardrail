# OpenAI SDK Adapter

Guard OpenAI chat completions with zero API changes.

## Install

```bash
npm install open-guardrail-openai open-guardrail openai
```

## Quick Start

```typescript
import OpenAI from 'openai';
import { pipe, promptInjection, pii } from 'open-guardrail';
import { createGuardedOpenAI } from 'open-guardrail-openai';

const openai = new OpenAI();

const guarded = createGuardedOpenAI(openai, {
  input: pipe(promptInjection({ action: 'block' })),
  output: pipe(pii({ entities: ['email'], action: 'mask' })),
});

// Use exactly like the normal OpenAI client
const res = await guarded.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

## Low-Level API

For more control, use `guardedCompletions` directly:

```typescript
import { guardedCompletions } from 'open-guardrail-openai';

const safeCreate = guardedCompletions(
  openai.chat.completions.create.bind(openai.chat.completions),
  { input: myInputPipeline, output: myOutputPipeline },
);
```

## Error Handling

```typescript
import { GuardrailBlockedError } from 'open-guardrail-openai';

try {
  await guarded.chat.completions.create({ ... });
} catch (err) {
  if (err instanceof GuardrailBlockedError) {
    console.log(err.stage);   // 'input' | 'output'
    console.log(err.result);  // PipelineResult
  }
}
```

## Blocked Callback

```typescript
const guarded = createGuardedOpenAI(openai, {
  input: inputPipeline,
  onBlocked: (result, stage) => {
    logger.warn(`Blocked at ${stage}`, result);
  },
});
```
