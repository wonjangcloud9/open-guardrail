# open-guardrail-vercel-ai

[![npm](https://img.shields.io/npm/v/open-guardrail-vercel-ai)](https://www.npmjs.com/package/open-guardrail-vercel-ai) [![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)

[Vercel AI SDK](https://sdk.vercel.ai/) middleware adapter for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail).

[![npm](https://img.shields.io/npm/v/open-guardrail-vercel-ai)](https://www.npmjs.com/package/open-guardrail-vercel-ai)

## Install

```bash
npm install open-guardrail-vercel-ai open-guardrail ai
```

## Usage

```typescript
import { createGuardrailMiddleware } from 'open-guardrail-vercel-ai';
import { pipe, promptInjection, pii, toxicity } from 'open-guardrail';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const middleware = createGuardrailMiddleware({
  input: pipe(
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
  ),
  output: pipe(
    toxicity({ action: 'block' }),
  ),
  onBlocked: (result, stage) => {
    console.log(`Blocked at ${stage}:`, result.action);
  },
});

const result = await generateText({
  model: openai('gpt-4o'),
  messages: [{ role: 'user', content: 'Hello' }],
  experimental_middleware: middleware,
});
```

## API

### `createGuardrailMiddleware(options)`

| Option | Type | Description |
|--------|------|-------------|
| `input` | `Pipeline` | Guards applied to user input (transformParams) |
| `output` | `Pipeline` | Guards applied to model output (wrapGenerate) |
| `onBlocked` | `(result, stage) => void` | Callback when a guard blocks |

Throws `GuardrailBlockedError` when a guard blocks.

## License

MIT
