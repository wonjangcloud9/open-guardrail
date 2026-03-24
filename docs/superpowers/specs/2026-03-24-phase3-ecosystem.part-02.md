## Feature 1: Streaming Pipeline

### Problem
기존 Pipeline.run()은 전체 텍스트를 받아 검증.
LLM 스트리밍 응답에서는 전체 텍스트가 완성되기 전에 빠른 가드 적용 필요.

### Design
```typescript
// 새로운 API
const stream = pipeline.stream(readableStream);
// 또는
const result = await pipeline.runStream(asyncIterable);
```

2단계 검증:
1. **청크 단계**: 각 청크마다 빠른 가드 적용 (regex, keyword, pii)
2. **완료 단계**: 전체 텍스트 완성 후 시맨틱 가드 (toxicity, hallucination)

Guard 인터페이스 확장:
```typescript
interface Guard {
  // 기존
  check(text: string, ctx: GuardContext): Promise<GuardResult>;
  // 새로 추가 (optional)
  checkChunk?(chunk: string, accumulated: string, ctx: GuardContext): Promise<GuardResult>;
  supportsStreaming?: boolean;
}
```

### Files
- Modify: `packages/core/src/types.ts` (Guard IF 확장)
- Create: `packages/core/src/streaming-pipeline.ts`
- Create: `packages/core/tests/streaming-pipeline.test.ts`

## Feature 2: Vercel AI SDK Adapter

### Design
```typescript
import { createGuardrailMiddleware } from 'open-guardrail/adapters/vercel-ai';
import { streamText } from 'ai';

const middleware = createGuardrailMiddleware({
  input: pipe(promptInjection({ action: 'block' }), pii({ action: 'mask' })),
  output: pipe(toxicity({ action: 'block' })),
});

const result = streamText({
  model: openai('gpt-4'),
  messages,
  experimental_middleware: middleware,
});
```

### Files
- Create: `packages/adapters/vercel-ai/package.json`
- Create: `packages/adapters/vercel-ai/src/index.ts`
- Create: `packages/adapters/vercel-ai/tests/middleware.test.ts`
