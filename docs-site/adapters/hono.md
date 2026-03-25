# Hono Middleware

Lightweight middleware for Hono — works on Cloudflare Workers, Deno, Bun, and Node.js.

## Install

```bash
npm install open-guardrail-hono open-guardrail hono
```

## Quick Start

```typescript
import { Hono } from 'hono';
import { pipe, promptInjection, pii } from 'open-guardrail';
import { createGuardrailMiddleware } from 'open-guardrail-hono';

const app = new Hono();

const guardrail = createGuardrailMiddleware({
  input: pipe(
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
  ),
});

app.post('/api/chat', guardrail, (c) => {
  // c.get('guardrailBody') has the safe (masked) body
  // c.get('guardrailResult') has the pipeline result
  const body = c.get('guardrailBody') ?? c.req.json();
  return c.json({ reply: `You said: ${body.message}` });
});

export default app;
```

## Options

```typescript
createGuardrailMiddleware({
  input: Pipeline,                         // input guard pipeline
  fieldName: 'message',                    // body field to guard (default: 'message')
  inputFrom: (c) => string | Promise<string>,  // custom text extractor
  onBlocked: (result, c) => Response | void,   // custom blocked handler
})
```

## Edge Runtime

open-guardrail runs entirely in JavaScript with no native dependencies — it works on:
- Cloudflare Workers
- Deno Deploy
- Bun
- Vercel Edge Functions
- Node.js

## Output Guard

```typescript
import { createOutputGuard } from 'open-guardrail-hono';

const guardOutput = createOutputGuard({
  output: pipe(pii({ entities: ['email'], action: 'mask' })),
});

app.post('/api/chat', guardrail, async (c) => {
  const llmResponse = await callLLM(c.get('guardrailBody').message);
  const safe = await guardOutput(llmResponse);
  return c.json({ reply: safe.output ?? llmResponse });
});
```
