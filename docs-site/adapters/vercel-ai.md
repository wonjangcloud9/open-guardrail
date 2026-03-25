# Vercel AI SDK Adapter

Middleware adapter for Vercel AI SDK's `generateText` / `streamText`.

## Install

```bash
npm install open-guardrail-vercel-ai open-guardrail ai
```

## Usage

```typescript
import { createGuardrailMiddleware } from 'open-guardrail-vercel-ai';
import { pipe, promptInjection, toxicity } from 'open-guardrail';

const middleware = createGuardrailMiddleware({
  input: pipe(promptInjection({ action: 'block' })),
  output: pipe(toxicity({ action: 'block' })),
  onBlocked: (result, stage) => {
    console.log(`Blocked at ${stage}:`, result.action);
  },
});
```

## How It Works

- `transformParams` — runs input guards on the last user message before sending to the model
- `wrapGenerate` — runs output guards on the model's response

The middleware modifies text in-place when guards use `override` action (e.g., PII masking).
