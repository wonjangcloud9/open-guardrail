# API 레퍼런스

주요 API 빠른 참조입니다.

## defineGuardrail (권장)

```typescript
const guard = defineGuardrail({
  guards: [guard1, guard2],
  mode?: 'fail-fast' | 'run-all',  // 기본: 'fail-fast'
  onError?: 'block' | 'allow',     // 기본: 'block'
  timeoutMs?: 5000,                 // 기본: 5000
  debug?: false,                    // 기본: false
});

const result = await guard(text, metadata?);
guard.pipeline;  // 이벤트/dispose를 위한 Pipeline 접근
```

## Pipeline

```typescript
const pipeline = pipe(guard1, guard2, guard3);

const result: PipelineResult = await pipeline.run(text, metadata?);
await pipeline.dispose();
```

## PipelineResult

```typescript
interface PipelineResult {
  passed: boolean;           // 차단되지 않으면 true
  action: GuardAction;       // 최고 우선순위 액션
  results: GuardResult[];    // 가드별 결과
  input: string;             // 원본 입력
  output?: string;           // 수정된 텍스트 (override 시)
  totalLatencyMs: number;
}
```

## 가드 유틸리티

| 유틸 | 설명 |
|------|------|
| `when(condition, guard)` | 조건부 실행 |
| `compose(name, ...guards)` | 가드 번들링 |
| `not(guard, action?)` | 가드 역전 |
| `retry(guard, opts)` | 실패 시 재시도 |
| `fallback(primary, secondary)` | 에러 시 대체 |

## SDK 어댑터

| 어댑터 | 주요 API |
|--------|---------|
| OpenAI | `createGuardedOpenAI(client, opts)` |
| Anthropic | `createGuardedAnthropic(client, opts)` |
| Next.js | `guardApiRoute(opts)`, `createRouteGuard(opts)` |
| Express | `createGuardrailMiddleware(opts)` |
| Fastify | `createGuardrailPlugin(opts)` |
| Hono | `createGuardrailMiddleware(opts)` |
| Vercel AI | `createGuardrailMiddleware(opts)` |
| LangChain | `createGuardrailChain(opts)` |
