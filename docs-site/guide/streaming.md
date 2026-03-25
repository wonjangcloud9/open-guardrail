# Streaming

Guard text as it streams from the LLM using `StreamingPipeline`.

## Usage

```typescript
import { StreamingPipeline, promptInjection, toxicity } from 'open-guardrail';

const pipeline = new StreamingPipeline({
  guards: [
    promptInjection({ action: 'block' }),
    toxicity({ action: 'block' }),
  ],
});

// Feed chunks as they arrive
await pipeline.pushChunk('Hello, ');
await pipeline.pushChunk('how can I ');
await pipeline.pushChunk('help you?');

// Finalize and run full-text semantic checks
const result = await pipeline.finish();
```

## How It Works

1. **Chunk-level checks** — guards with `supportsStreaming: true` run `checkChunk()` on each incoming chunk
2. **Full-text check** — on `finish()`, all guards run `check()` on the complete accumulated text
3. **Early exit** — if a chunk-level check blocks, you can stop streaming immediately

## Guards with Streaming Support

Guards that implement `checkChunk()` can catch issues during streaming:
- `keyword` — matches on each chunk
- `regex` — pattern checks per chunk
- `wordCount` — running character/word count
- `pii` — detects PII patterns in chunks
