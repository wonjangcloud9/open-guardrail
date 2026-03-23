## Usage Patterns

### 1. Programmatic Pipeline

```typescript
// pipe()는 createPipeline()의 축약형
// 기본값: type='input', mode='fail-fast'
const result = await pipe(
  toxicity({ threshold: 0.7 }),
  pii({ action: 'mask' }),
  topicDeny({ topics: ['politics'] })
).run(text);

// 명시적 설정이 필요할 때는 createPipeline
const outputPipeline = createPipeline({
  type: 'output',
  mode: 'run-all',
  onError: 'warn',
  dryRun: false,
  guards: [
    toxicity({ threshold: 0.7 }),
    schema({ jsonSchema: mySchema }),
  ]
});
```

### 2. Declarative Config (YAML)

```typescript
// Node.js: 파일 경로로 로드
const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
// Edge/Browser: 객체로 로드 (fs 없는 환경)
const engine = OpenGuardrail.fromObject(configObj);
const result = await engine.run(text);
```

### 3. Event Hooks

```typescript
engine.on('guard:before', (ctx) => { /* logging */ });
engine.on('guard:blocked', (ctx) => { /* alert */ });
engine.on('guard:after', (ctx) => { /* metrics */ });
engine.on('guard:error', (err, ctx) => { /* error */ });
```

### 4. Dry Run Mode

```typescript
// 모든 가드 실행하되 절대 block 하지 않음
// 프로덕션 모니터링/테스트용
const result = await createPipeline({
  guards: [...],
  dryRun: true
}).run(text);
// result.passed는 항상 true, 개별 결과는 기록됨
```

## YAML Config Example

```yaml
version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    timeoutMs: 5000
    guards:
      - type: prompt-injection
        action: block
      - type: pii
        action: mask
        config:
          entities: [email, phone, ssn]
      - type: topic-deny
        action: block
        config:
          topics: [violence, illegal]
  output:
    mode: run-all
    onError: warn
    guards:
      - type: toxicity
        threshold: 0.7
        action: warn
      - type: hallucination
        action: block
        config:
          provider: openai
          model: gpt-4o-mini
```
