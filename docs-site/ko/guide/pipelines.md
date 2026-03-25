# 파이프라인

파이프라인은 가드를 체이닝하여 텍스트에 실행합니다.

## 파이프라인 생성

### `pipe()` (단축형)

```typescript
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';

const pipeline = pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email'], action: 'mask' }),
  keyword({ denied: ['hack'], action: 'block' }),
);

const result = await pipeline.run('사용자 입력');
```

### `createPipeline()` (상세 설정)

```typescript
import { createPipeline } from 'open-guardrail';

const pipeline = createPipeline({
  guards: [promptInjection({ action: 'block' })],
  type: 'input',
  mode: 'fail-fast',
  onError: 'block',
  timeoutMs: 5000,
  dryRun: false,
});
```

## 파이프라인 모드

### fail-fast (기본값)

첫 번째 `block` 액션에서 중단합니다. 빠른 입력 검증에 적합합니다.

### run-all

모든 가드를 실행합니다. 감사 로깅이나 분석이 필요할 때 유용합니다.

## 드라이 런 모드

실제 차단 없이 가드를 테스트합니다:

```typescript
const pipeline = createPipeline({
  guards: [...],
  dryRun: true,  // 항상 통과, 결과만 보고
});
```

## 에러 처리

| `onError` | 동작 |
|-----------|------|
| `'block'` (기본) | 에러를 차단으로 처리 |
| `'allow'` | 에러를 허용으로 처리 (fail-open) |
| `'warn'` | 에러를 경고로 처리 |

## 이벤트 훅

```typescript
pipeline.on('guard:before', ({ guardName, text }) => { ... });
pipeline.on('guard:after', ({ guardName, result }) => { ... });
pipeline.on('guard:blocked', ({ guardName, result }) => { ... });
pipeline.on('guard:error', ({ guardName, error }) => { ... });
```
