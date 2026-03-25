# 가드 유틸리티

가드를 합성하고 변환하는 유틸리티입니다.

## `when(condition, guard)` — 조건부 실행

조건이 충족될 때만 가드를 실행합니다:

```typescript
import { when, pipe, toxicity, pii } from 'open-guardrail';

// 긴 텍스트에만 독성 검사
const pipeline = pipe(
  when((text) => text.length > 200, toxicity({ action: 'block' })),
  pii({ entities: ['email'], action: 'mask' }),
);
```

## `compose(name, ...guards)` — 가드 번들링

여러 가드를 하나의 재사용 가능한 단위로 합칩니다:

```typescript
import { compose, promptInjection, keyword, encodingAttack } from 'open-guardrail';

const 보안번들 = compose('security',
  promptInjection({ action: 'block' }),
  keyword({ denied: ['hack'], action: 'block' }),
  encodingAttack({ action: 'block' }),
);

const pipeline = pipe(보안번들, pii({ entities: ['email'], action: 'mask' }));
```

## `not(guard)` — 가드 역전

"반드시 포함해야 함" 로직에 유용합니다:

```typescript
import { not, keyword } from 'open-guardrail';

// 면책조항이 없으면 차단
const 면책조항필수 = not(keyword({ allowed: ['면책조항', '주의:'], action: 'block' }));
```

## `retry(guard, opts)` — 재시도

LLM 기반 가드의 네트워크 에러 시 재시도:

```typescript
import { retry, llmJudge } from 'open-guardrail';

const 안정적판단 = retry(
  llmJudge({ prompt: '안전한가요?', call: myLlmCall, action: 'block' }),
  { maxRetries: 2, delayMs: 500 },
);
```

## `fallback(primary, secondary)` — 대체 가드

LLM 가드 실패 시 로컬 가드로 대체:

```typescript
import { fallback, llmJudge, keyword } from 'open-guardrail';

const 안전한가드 = fallback(
  llmJudge({ ... }),             // LLM 기반 (기본)
  keyword({ denied: ['hack'] }), // 로컬 (대체)
);
```
