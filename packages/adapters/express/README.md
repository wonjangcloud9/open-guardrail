# open-guardrail-express

Express middleware adapter for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail).

## Install

```bash
pnpm add open-guardrail-express open-guardrail-core
```

## Usage

```typescript
import express from 'express';
import { pipe, promptInjection, pii } from 'open-guardrail';
import { createGuardrailMiddleware, createOutputGuard } from 'open-guardrail-express';

const app = express();
app.use(express.json());

// Guard all incoming requests
app.use(createGuardrailMiddleware({
  input: pipe(promptInjection({ action: 'block' })),
  fieldName: 'message',        // default
  // inputFrom: 'body',        // 'body' | 'query' | (req) => string
  // onBlocked: (result, req, res) => res.status(400).json({ err: 'nope' }),
}));

// Guard LLM output before responding
const guardOutput = createOutputGuard({
  output: pipe(pii({ entities: ['email'], action: 'mask' })),
});

app.post('/chat', async (req, res) => {
  const llmResponse = await getLLMResponse(req.body.message);
  const safe = await guardOutput(llmResponse);
  res.json({ reply: safe });
});
```

## License

MIT
