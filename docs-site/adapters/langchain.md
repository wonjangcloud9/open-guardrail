# LangChain.js Adapter

Guard LangChain chains and agents.

## Install

```bash
npm install open-guardrail-langchain open-guardrail @langchain/core
```

## Usage

```typescript
import { createGuardrailChain } from 'open-guardrail-langchain';
import { pipe, promptInjection, pii } from 'open-guardrail';

const chain = createGuardrailChain({
  input: pipe(promptInjection({ action: 'block' })),
  output: pipe(pii({ entities: ['email'], action: 'mask' })),
});

// Guard input
const safeInput = await chain.invoke('user message');

// Guard output
const safeOutput = await chain.guardOutput('llm response');

// Batch
const results = await chain.batch(['msg1', 'msg2']);
```

## With LCEL

```typescript
const guardrail = createGuardrailChain({ input: inputPipeline });
// Use guardrail.invoke() as a step in your chain
```
