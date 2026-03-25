# Custom Guards

Create your own guard by implementing the `Guard` interface.

## Guard Interface

```typescript
import type { Guard, GuardContext, GuardResult } from 'open-guardrail-core';

const myGuard: Guard = {
  name: 'my-guard',
  version: '1.0.0',
  description: 'My custom guard',
  category: 'custom',
  supportedStages: ['input', 'output'],

  async check(text: string, ctx: GuardContext): Promise<GuardResult> {
    const start = performance.now();
    const hasProblem = text.includes('bad-word');

    return {
      guardName: 'my-guard',
      passed: !hasProblem,
      action: hasProblem ? 'block' : 'allow',
      message: hasProblem ? 'Found bad word' : undefined,
      latencyMs: Math.round(performance.now() - start),
    };
  },
};
```

## Factory Pattern

Wrap your guard in a factory function for configurability:

```typescript
interface MyGuardOptions {
  blockedWords: string[];
  action: 'block' | 'warn';
}

function myGuard(options: MyGuardOptions): Guard {
  return {
    name: 'my-guard',
    version: '1.0.0',
    description: 'Custom blocked word guard',
    category: 'custom',
    supportedStages: ['input', 'output'],

    async check(text, ctx) {
      const start = performance.now();
      const lower = text.toLowerCase();
      const found = options.blockedWords.find((w) => lower.includes(w));

      return {
        guardName: 'my-guard',
        passed: !found,
        action: found ? options.action : 'allow',
        message: found ? `Found: ${found}` : undefined,
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
```

## Using Custom Guards

```typescript
import { pipe, promptInjection } from 'open-guardrail';

const pipeline = pipe(
  promptInjection({ action: 'block' }),
  myGuard({ blockedWords: ['spam', 'scam'], action: 'block' }),
);
```

## Streaming Support

Add `checkChunk()` for streaming pipeline compatibility:

```typescript
const myStreamingGuard: Guard = {
  // ... base fields
  supportsStreaming: true,

  async checkChunk(chunk, accumulated, ctx) {
    // chunk: current chunk
    // accumulated: all text so far
    return { /* GuardResult */ };
  },
};
```
