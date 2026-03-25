# Fastify Plugin

Fastify plugin for guarding API requests with open-guardrail.

## Install

```bash
npm install open-guardrail-fastify open-guardrail fastify
```

## Quick Start

```typescript
import Fastify from 'fastify';
import { pipe, promptInjection, pii } from 'open-guardrail';
import { createGuardrailPlugin } from 'open-guardrail-fastify';

const app = Fastify();

const guardrail = createGuardrailPlugin({
  input: pipe(
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
  ),
});

app.register(guardrail);

app.post('/api/chat', (request, reply) => {
  // request.body.message is now safe (PII masked if needed)
  reply.send({ reply: `You said: ${request.body.message}` });
});

app.listen({ port: 3000 });
```

## Options

```typescript
createGuardrailPlugin({
  input: Pipeline,                  // input guard pipeline
  fieldName: 'message',             // body field to guard (default: 'message')
  inputFrom: (request) => string,   // custom text extractor
  onBlocked: (result, request, reply) => void,  // custom blocked handler
})
```

## Default Blocked Response

When blocked without custom `onBlocked`:

```json
{ "error": "blocked", "action": "block", "guardName": "prompt-injection" }
```

Status code: `403`

## Output Guard

```typescript
import { createOutputGuard } from 'open-guardrail-fastify';

const guardOutput = createOutputGuard({
  output: pipe(pii({ entities: ['email'], action: 'mask' })),
});

app.post('/api/chat', async (request, reply) => {
  const llmResponse = await callLLM(request.body.message);
  const safe = await guardOutput(llmResponse);
  reply.send({ reply: safe.output ?? llmResponse });
});
```
