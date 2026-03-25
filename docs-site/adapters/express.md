# Express Middleware

Drop-in Express middleware for guarding API requests.

## Install

```bash
npm install open-guardrail-express open-guardrail express
```

## Quick Start

```typescript
import express from 'express';
import { pipe, promptInjection, pii } from 'open-guardrail';
import { createGuardrailMiddleware } from 'open-guardrail-express';

const app = express();
app.use(express.json());

const guardrail = createGuardrailMiddleware({
  input: pipe(
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
  ),
});

app.post('/api/chat', guardrail, (req, res) => {
  // req.body.message is now safe (PII masked if needed)
  // req.guardrailResult contains the pipeline result
  res.json({ reply: `You said: ${req.body.message}` });
});
```

## Options

```typescript
createGuardrailMiddleware({
  input: Pipeline,              // input guard pipeline
  fieldName: 'message',         // which body field to guard (default: 'message')
  inputFrom: (req) => string,   // custom text extractor
  onBlocked: (result, req, res) => void,  // custom blocked handler
})
```

## Default Blocked Response

When text is blocked and no `onBlocked` is provided:

```json
{
  "error": "blocked",
  "action": "block",
  "guardName": "prompt-injection"
}
```

Status code: `403`

## Output Guard

Guard text before sending a response:

```typescript
import { createOutputGuard } from 'open-guardrail-express';

const guardOutput = createOutputGuard({
  output: pipe(pii({ entities: ['email'], action: 'mask' })),
});

app.post('/api/chat', guardrail, async (req, res) => {
  const llmResponse = await callLLM(req.body.message);
  const safe = await guardOutput(llmResponse);
  res.json({ reply: safe.output ?? llmResponse });
});
```
