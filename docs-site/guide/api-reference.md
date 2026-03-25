# API Reference

Quick reference for all core APIs.

## Pipeline

```typescript
// Shorthand
const pipeline = pipe(guard1, guard2, guard3);

// Full options
const pipeline = createPipeline({
  guards: [guard1, guard2],
  type: 'input' | 'output',      // default: 'input'
  mode: 'fail-fast' | 'run-all', // default: 'fail-fast'
  onError: 'block' | 'allow' | 'warn', // default: 'block'
  timeoutMs: 5000,                // default: 5000
  dryRun: false,                  // default: false
  debug: false,                   // default: false
});

const result: PipelineResult = await pipeline.run(text, metadata?);
await pipeline.dispose();
```

## PipelineResult

```typescript
interface PipelineResult {
  passed: boolean;
  action: 'allow' | 'block' | 'warn' | 'override';
  results: GuardResult[];
  input: string;
  output?: string;        // modified text (if override)
  totalLatencyMs: number;
  metadata: { pipelineType, mode, dryRun, timestamp };
}
```

## GuardResult

```typescript
interface GuardResult {
  guardName: string;
  passed: boolean;
  action: GuardAction;
  score?: number;         // 0-1 severity
  message?: string;
  overrideText?: string;  // modified text
  details?: Record<string, unknown>;
  latencyMs: number;
}
```

## Guard Utilities

| Utility | Signature | Description |
|---------|-----------|-------------|
| `when` | `when(condition, guard)` | Conditional execution |
| `compose` | `compose(name, ...guards)` | Bundle guards into one |
| `not` | `not(guard, action?)` | Negate a guard |
| `retry` | `retry(guard, { maxRetries, delayMs, onExhausted })` | Retry on failure |
| `fallback` | `fallback(primary, secondary)` | Fallback on error |

## GuardRegistry

```typescript
const registry = new GuardRegistry();
registry.register(type, factory);       // register a guard factory
registry.use(plugin);                   // register a plugin
registry.resolve(type, config);         // create a guard instance
registry.list();                        // list all types
registry.plugins();                     // list plugins
registry.getMeta(type);                 // get plugin metadata
registry.describe();                    // list guards with plugin info
```

## GuardPlugin

```typescript
interface GuardPlugin {
  meta: {
    name: string;
    version: string;
    description: string;
    author?: string;
    homepage?: string;
    tags?: string[];
  };
  guards: Record<string, (config) => Guard>;
}
```

## OpenGuardrail (YAML config)

```typescript
const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
const engine = OpenGuardrail.fromString(yamlString);
const engine = OpenGuardrail.fromObject(configObject);

engine.use(plugin);                     // register plugin guards
engine.registerGuard(type, factory);    // register single guard
const result = await engine.run(text, stage?);
await engine.dispose();
```

## StreamingPipeline

```typescript
const sp = new StreamingPipeline({ guards });
await sp.pushChunk(chunk);             // feed chunks
const result = await sp.finish();      // finalize + full-text check
```

## GuardRouter

```typescript
const router = new GuardRouter({
  classifier: async (text) => 'low' | 'medium' | 'high',
  routes: { low: pipeline1, medium: pipeline2, high: pipeline3 },
});
const result = await router.route(text);
```

## AuditLogger

```typescript
const logger = new AuditLogger();
logger.record(entry);                  // log a guard execution
logger.entries();                      // get all entries
logger.clear();                        // clear log
```

## EventBus

```typescript
pipeline.on('guard:before', ({ guardName, text }) => {});
pipeline.on('guard:after', ({ guardName, text, result }) => {});
pipeline.on('guard:blocked', ({ guardName, text, result }) => {});
pipeline.on('guard:error', ({ guardName, error }) => {});
```
