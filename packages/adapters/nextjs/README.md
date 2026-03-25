# open-guardrail-nextjs

[![npm](https://img.shields.io/npm/v/open-guardrail-nextjs)](https://www.npmjs.com/package/open-guardrail-nextjs) [![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)

Next.js App Router adapter for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail).

## Install

```bash
pnpm add open-guardrail open-guardrail-nextjs
```

## Usage — App Router

### `createRouteGuard`

Wrap an App Router route handler:

```ts
// app/api/chat/route.ts
import { pipe, promptInjection } from 'open-guardrail';
import { createRouteGuard } from 'open-guardrail-nextjs';

const guard = createRouteGuard({
  input: pipe(promptInjection({ action: 'block' })),
});

export const POST = guard(async (request) => {
  const { message } = await request.json();
  const reply = await getAIResponse(message);
  return Response.json({ reply });
});
```

### `guardApiRoute`

Lighter helper — returns parsed body or 403:

```ts
// app/api/chat/route.ts
import { pipe, toxicity } from 'open-guardrail';
import { guardApiRoute } from 'open-guardrail-nextjs';

const guard = guardApiRoute({
  input: pipe(toxicity({ action: 'block' })),
});

export async function POST(request: Request) {
  const checked = await guard(request);
  if (checked instanceof Response) return checked;
  const { body } = checked;
  return Response.json({ reply: body.message });
}
```

### `guardResponse`

Guard LLM output before returning:

```ts
import { pipe, pii } from 'open-guardrail';
import { guardResponse } from 'open-guardrail-nextjs';

const outputPipeline = pipe(pii({ entities: ['email'], action: 'mask' }));

const safeText = await guardResponse(outputPipeline, llmOutput);
```

## License

MIT
