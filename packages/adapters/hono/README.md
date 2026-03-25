# open-guardrail-hono

Hono middleware adapter for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail). Guard LLM input/output on edge runtimes (Cloudflare Workers, Deno, Bun, Node.js).

## Install

```bash
pnpm add open-guardrail open-guardrail-hono
```

## Usage

```typescript
import { Hono } from 'hono';
import { pipe, promptInjection, pii } from 'open-guardrail';
import { createGuardrailMiddleware, createOutputGuard } from 'open-guardrail-hono';

const app = new Hono();

app.use('/chat/*', createGuardrailMiddleware({
  input: pipe(promptInjection({ action: 'block' })),
}));

const guardOutput = createOutputGuard({
  output: pipe(pii({ entities: ['email'], action: 'mask' })),
});

app.post('/chat', async (c) => {
  const body = c.get('guardrailBody') ?? await c.req.json();
  const reply = await getLLMResponse(body.message);
  const safe = await guardOutput(reply);
  return c.json({ reply: safe });
});

export default app;
```

## License

MIT
