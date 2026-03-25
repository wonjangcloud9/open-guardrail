# AI Delegation Guards

These guards delegate judgment to an external LLM. You provide a `call` function that sends prompts to your LLM of choice.

## llmJudge

Delegate any custom judgment to an external LLM.

```typescript
llmJudge({
  action: 'block' | 'warn',
  prompt: string,             // judgment prompt template
  call: LlmCallFn,           // (prompt: string) => Promise<string>
})
```

## hallucination

Fact-check LLM output against source documents.

```typescript
hallucination({
  action: 'block' | 'warn',
  sources: string[],          // reference documents
  call: LlmCallFn,
})
```

## relevance

Verify that the response is relevant to the original question.

```typescript
relevance({
  action: 'block' | 'warn',
  question: string,
  call: LlmCallFn,
})
```

## groundedness

Verify RAG response grounding — ensure claims are supported by retrieved documents.

```typescript
groundedness({
  action: 'block' | 'warn',
  sources: string[],
  call: LlmCallFn,
})
```
