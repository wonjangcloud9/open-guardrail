# open-guardrail-langchain

[LangChain.js](https://js.langchain.com/) integration for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail).

[![npm](https://img.shields.io/npm/v/open-guardrail-langchain)](https://www.npmjs.com/package/open-guardrail-langchain)

## Install

```bash
npm install open-guardrail-langchain open-guardrail
```

## Usage

```typescript
import { createGuardrailChain } from 'open-guardrail-langchain';
import { pipe, promptInjection, pii, toxicity } from 'open-guardrail';

const guardrail = createGuardrailChain({
  input: pipe(
    promptInjection({ action: 'block' }),
    pii({ entities: ['email'], action: 'mask' }),
  ),
  output: pipe(
    toxicity({ action: 'block' }),
  ),
  onBlocked: (result, stage) => {
    console.log(`Blocked at ${stage}:`, result.action);
  },
});

// Guard input before sending to LLM
const safeInput = await guardrail.invoke('user message');

// Guard output after LLM response
const safeOutput = await guardrail.guardOutput(llmResponse);

// Batch
const results = await guardrail.batch(['msg1', 'msg2']);
```

## API

### `createGuardrailChain(options)`

Returns a `GuardrailRunnable` with `invoke()`, `batch()`, `guardInput()`, `guardOutput()`.

| Option | Type | Description |
|--------|------|-------------|
| `input` | `Pipeline` | Guards for user input |
| `output` | `Pipeline` | Guards for LLM output |
| `onBlocked` | `(result, stage) => void` | Callback on block |

## License

MIT
