# open-guardrail-fastify

Fastify plugin adapter for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail).

## Install

```bash
pnpm add open-guardrail-fastify open-guardrail-core
```

## Usage

```typescript
import Fastify from 'fastify';
import { pipe, promptInjection, pii } from 'open-guardrail';
import { createGuardrailPlugin, createOutputGuard } from 'open-guardrail-fastify';

const app = Fastify();

// Guard all incoming requests
app.register(createGuardrailPlugin({
  input: pipe(promptInjection({ action: 'block' })),
  fieldName: 'message',        // default
  // inputFrom: (request) => request.body.prompt,
  // onBlocked: (result, request, reply) => reply.code(400).send({ err: 'nope' }),
}));

// Guard LLM output before responding
const guardOutput = createOutputGuard({
  output: pipe(pii({ entities: ['email'], action: 'mask' })),
});

app.post('/chat', async (request, reply) => {
  const llmResponse = await getLLMResponse(request.body.message);
  const safe = await guardOutput(llmResponse);
  reply.send({ reply: safe });
});
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `input` | `Pipeline` | — | Input guard pipeline |
| `fieldName` | `string` | `'message'` | Body field to guard |
| `inputFrom` | `(request) => string` | — | Custom text extractor |
| `onBlocked` | `(result, request, reply) => void` | — | Custom block handler |

## License

MIT
