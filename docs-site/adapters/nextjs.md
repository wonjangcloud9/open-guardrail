# Next.js Adapter

Guard Next.js App Router API routes with minimal boilerplate.

## Install

```bash
npm install open-guardrail-nextjs open-guardrail next
```

## Quick Start — Route Guard

Wrap your API route handler:

```typescript
// app/api/chat/route.ts
import { pipe, promptInjection, pii } from 'open-guardrail';
import { createRouteGuard } from 'open-guardrail-nextjs';

const withGuard = createRouteGuard({
  input: pipe(
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
  ),
});

export const POST = withGuard(async (request, { body, result }) => {
  // body.message is safe (PII masked if needed)
  // result is the PipelineResult
  return Response.json({ reply: `You said: ${body.message}` });
});
```

## Simple Helper — guardApiRoute

For quick prototyping:

```typescript
import { guardApiRoute } from 'open-guardrail-nextjs';

const guard = guardApiRoute({
  input: pipe(promptInjection({ action: 'block' })),
});

export async function POST(request: Request) {
  const guarded = await guard(request);
  if (guarded instanceof Response) return guarded; // 403 blocked

  const { body, result } = guarded;
  return Response.json({ reply: body.message });
}
```

## Output Guard

```typescript
import { guardResponse } from 'open-guardrail-nextjs';

const outputPipeline = pipe(pii({ entities: ['email'], action: 'mask' }));

export async function POST(request: Request) {
  const llmResponse = await callLLM(body.message);
  const safe = await guardResponse(outputPipeline, llmResponse);
  return Response.json({ reply: safe.output ?? llmResponse });
}
```

## Options

```typescript
createRouteGuard({
  input: Pipeline,                       // input guard pipeline
  fieldName: 'message',                  // body field (default: 'message')
  inputFrom: (body) => string,           // custom text extractor
  onBlocked: (result) => Response,       // custom blocked response
})
```

## Default Blocked Response

```json
{ "error": "blocked", "action": "block", "guardName": "prompt-injection" }
```

Status code: `403`
