## Usage Patterns

### 1. Programmatic Pipeline

```typescript
const result = await pipe(
  toxicity({ threshold: 0.7 }),
  pii({ action: 'mask' }),
  topicDeny({ topics: ['politics'] })
).run(text);
```

### 2. Declarative Config (YAML)

```typescript
const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
const result = await engine.run(text);
```

### 3. Event Hooks

```typescript
engine.on('guard:before', (ctx) => { /* logging */ });
engine.on('guard:blocked', (ctx) => { /* alert */ });
engine.on('guard:after', (ctx) => { /* metrics */ });
```

### Input/Output Separation

```typescript
const inputPipeline = createPipeline({
  type: 'input', guards: [...]
});
const outputPipeline = createPipeline({
  type: 'output', guards: [...]
});
```
