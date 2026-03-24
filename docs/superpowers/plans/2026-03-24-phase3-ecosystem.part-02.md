## Task 1: Streaming Pipeline

**Files:**
- Modify: `packages/core/src/types.ts`
- Create: `packages/core/src/streaming-pipeline.ts`
- Create: `packages/core/tests/streaming-pipeline.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Extend Guard interface in types.ts**

Add optional streaming methods to Guard interface:

```typescript
// Add to Guard interface
checkChunk?(chunk: string, accumulated: string, ctx: GuardContext): Promise<GuardResult>;
supportsStreaming?: boolean;
```

- [ ] **Step 2: Write failing tests**

Create `packages/core/tests/streaming-pipeline.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { StreamingPipeline } from '../src/streaming-pipeline.js';
import type { Guard, GuardResult, GuardContext } from '../src/types.js';

function makeStreamGuard(name: string, opts: { blockWord?: string } = {}): Guard {
  return {
    name,
    version: '1.0.0',
    description: `test streaming guard ${name}`,
    category: 'custom',
    supportedStages: ['output'],
    supportsStreaming: true,
    async check(text: string): Promise<GuardResult> {
      const blocked = opts.blockWord ? text.includes(opts.blockWord) : false;
      return { guardName: name, passed: !blocked, action: blocked ? 'block' : 'allow', latencyMs: 0 };
    },
    async checkChunk(chunk: string, accumulated: string): Promise<GuardResult> {
      const blocked = opts.blockWord ? chunk.includes(opts.blockWord) : false;
      return { guardName: name, passed: !blocked, action: blocked ? 'block' : 'allow', latencyMs: 0 };
    },
  };
}

async function* toAsyncIterable(chunks: string[]): AsyncIterable<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

describe('StreamingPipeline', () => {
  it('processes chunks and returns final result', async () => {
    const guard = makeStreamGuard('g1');
    const sp = new StreamingPipeline({ guards: [guard] });
    const result = await sp.runStream(toAsyncIterable(['hello ', 'world']));
    expect(result.passed).toBe(true);
    expect(result.input).toBe('hello world');
  });

  it('blocks on chunk containing bad word', async () => {
    const guard = makeStreamGuard('g1', { blockWord: 'bad' });
    const sp = new StreamingPipeline({ guards: [guard] });
    const result = await sp.runStream(toAsyncIterable(['good ', 'bad ', 'text']));
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('runs non-streaming guards on full text after stream ends', async () => {
    const fullGuard: Guard = {
      name: 'full-only',
      version: '1.0.0',
      description: 'only checks full text',
      category: 'custom',
      supportedStages: ['output'],
      async check(text: string): Promise<GuardResult> {
        const blocked = text.includes('secret');
        return { guardName: 'full-only', passed: !blocked, action: blocked ? 'block' : 'allow', latencyMs: 0 };
      },
    };
    const sp = new StreamingPipeline({ guards: [fullGuard] });
    const result = await sp.runStream(toAsyncIterable(['no ', 'secret ', 'here']));
    expect(result.passed).toBe(false);
  });

  it('collects chunks via onChunk callback', async () => {
    const guard = makeStreamGuard('g1');
    const sp = new StreamingPipeline({ guards: [guard] });
    const chunks: string[] = [];
    await sp.runStream(toAsyncIterable(['a', 'b', 'c']), { onChunk: (c) => chunks.push(c) });
    expect(chunks).toEqual(['a', 'b', 'c']);
  });

  it('stops emitting chunks after block in fail-fast', async () => {
    const guard = makeStreamGuard('g1', { blockWord: 'stop' });
    const sp = new StreamingPipeline({ guards: [guard], mode: 'fail-fast' });
    const chunks: string[] = [];
    await sp.runStream(toAsyncIterable(['ok ', 'stop ', 'more']), { onChunk: (c) => chunks.push(c) });
    expect(chunks).toEqual(['ok ']);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd packages/core && pnpm test -- streaming`
Expected: FAIL — module not found

- [ ] **Step 4: Implement streaming-pipeline.ts**

Create `packages/core/src/streaming-pipeline.ts`:

```typescript
import type { Guard, GuardContext, GuardResult, PipelineResult, PipelineMode, OnErrorAction, PipelineStage, GuardAction } from './types.js';
import { GuardError } from './errors.js';
import { EventBus } from './event-bus.js';

const ACTION_PRIORITY: Record<GuardAction, number> = { block: 4, override: 3, warn: 2, allow: 1 };

interface StreamingPipelineOptions {
  guards: Guard[];
  type?: PipelineStage;
  mode?: PipelineMode;
  onError?: OnErrorAction;
  timeoutMs?: number;
}

interface StreamOptions {
  onChunk?: (chunk: string) => void;
  metadata?: Record<string, unknown>;
}

export class StreamingPipeline {
  private guards: Guard[];
  private type: PipelineStage;
  private mode: PipelineMode;
  private onError: OnErrorAction;
  private eventBus = new EventBus();

  constructor(options: StreamingPipelineOptions) {
    this.guards = options.guards;
    this.type = options.type ?? 'output';
    this.mode = options.mode ?? 'fail-fast';
    this.onError = options.onError ?? 'block';
  }

  async runStream(stream: AsyncIterable<string>, options?: StreamOptions): Promise<PipelineResult> {
    const start = performance.now();
    const streamingGuards = this.guards.filter((g) => g.supportsStreaming && g.checkChunk);
    const fullTextGuards = this.guards.filter((g) => !g.supportsStreaming || !g.checkChunk);

    let accumulated = '';
    const chunkResults: GuardResult[] = [];
    let blocked = false;

    for await (const chunk of stream) {
      if (blocked) break;

      for (const guard of streamingGuards) {
        try {
          const result = await guard.checkChunk!(chunk, accumulated, { pipelineType: this.type, metadata: options?.metadata });
          if (result.action === 'block') {
            chunkResults.push(result);
            blocked = true;
            if (this.mode === 'fail-fast') break;
          }
        } catch (err) {
          const guardError = err instanceof GuardError ? err : GuardError.fromException(guard.name, err as Error);
          chunkResults.push({
            guardName: guard.name, passed: this.onError === 'allow',
            action: this.onError, latencyMs: 0, error: guardError.toJSON(),
          });
        }
      }

      if (!blocked) {
        options?.onChunk?.(chunk);
      }
      accumulated += chunk;
    }

    // Phase 2: full text guards
    const fullResults: GuardResult[] = [];
    if (!blocked || this.mode === 'run-all') {
      for (const guard of fullTextGuards) {
        try {
          const result = await guard.check(accumulated, { pipelineType: this.type, metadata: options?.metadata });
          fullResults.push(result);
          if (result.action === 'block' && this.mode === 'fail-fast') {
            blocked = true;
            break;
          }
          if (result.action === 'block') blocked = true;
        } catch (err) {
          const guardError = err instanceof GuardError ? err : GuardError.fromException(guard.name, err as Error);
          fullResults.push({
            guardName: guard.name, passed: this.onError === 'allow',
            action: this.onError, latencyMs: 0, error: guardError.toJSON(),
          });
        }
      }
    }

    const allResults = [...chunkResults, ...fullResults];
    const aggregatedAction = this.aggregateAction(allResults);

    return {
      passed: aggregatedAction !== 'block',
      action: aggregatedAction,
      results: allResults,
      input: accumulated,
      totalLatencyMs: Math.round(performance.now() - start),
      metadata: { pipelineType: this.type, mode: this.mode, dryRun: false, timestamp: new Date().toISOString() },
    };
  }

  private aggregateAction(results: GuardResult[]): GuardAction {
    if (results.length === 0) return 'allow';
    return results.reduce<GuardAction>((highest, r) =>
      ACTION_PRIORITY[r.action] > ACTION_PRIORITY[highest] ? r.action : highest, 'allow');
  }
}
```

- [ ] **Step 5: Export from index.ts**

Add to `packages/core/src/index.ts`:
```typescript
export { StreamingPipeline } from './streaming-pipeline.js';
```

- [ ] **Step 6: Run tests**

Run: `cd packages/core && pnpm test`
Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/
git commit -m "feat(core): add StreamingPipeline with chunk-level guard validation"
```
