# Pipelines

Pipelines chain guards together and run them on text.

## Creating Pipelines

### With `pipe()` (shorthand)

```typescript
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';

const pipeline = pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email'], action: 'mask' }),
  keyword({ denied: ['hack'], action: 'block' }),
);

const result = await pipeline.run('user input');
```

### With `createPipeline()` (full control)

```typescript
import { createPipeline, promptInjection, pii } from 'open-guardrail';

const pipeline = createPipeline({
  guards: [
    promptInjection({ action: 'block' }),
    pii({ entities: ['email'], action: 'mask' }),
  ],
  type: 'input',
  mode: 'fail-fast',
  onError: 'block',
  timeoutMs: 5000,
  dryRun: false,
});
```

## Pipeline Modes

### fail-fast (default)

Stops at the first `block` action. Best for input validation where you want to reject fast.

### run-all

Runs every guard regardless of results. Useful when you need all results (audit logging, analytics).

## Dry Run Mode

Test guards without actually blocking:

```typescript
const pipeline = createPipeline({
  guards: [...],
  dryRun: true,  // reports what would happen, but always passes
});
```

## Error Handling

When a guard throws or times out:

| `onError` | Behavior |
|-----------|----------|
| `'block'` (default) | Treat error as block |
| `'allow'` | Treat error as allow (fail-open) |
| `'warn'` | Treat error as warning |

## Event Hooks

```typescript
const pipeline = pipe(promptInjection({ action: 'block' }));

pipeline.on('guard:before', ({ guardName, text }) => { ... });
pipeline.on('guard:after', ({ guardName, result }) => { ... });
pipeline.on('guard:blocked', ({ guardName, result }) => { ... });
pipeline.on('guard:error', ({ guardName, error }) => { ... });
```

## Cleanup

```typescript
await pipeline.dispose();  // cleanup guard resources
```
