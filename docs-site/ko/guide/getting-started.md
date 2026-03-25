# 시작하기

## 설치

```bash
npm install open-guardrail
```

필요한 부분만 설치할 수도 있습니다:

```bash
npm install open-guardrail-core open-guardrail-guards
```

## 빠른 시작

```typescript
import { defineGuardrail, promptInjection, pii, keyword } from 'open-guardrail';

const guard = defineGuardrail({
  guards: [
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
    keyword({ denied: ['hack', 'exploit'], action: 'block' }),
  ],
});

const result = await guard('사용자 입력 텍스트');
if (!result.passed) console.log('차단됨:', result.action);
```

`pipe()` 단축형:

```typescript
const result = await pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email'], action: 'mask' }),
).run('사용자 입력');
```

## 동작 원리

1. **가드 생성** — 텍스트를 검사하고 `allow`, `block`, `warn`, `override` 중 하나를 반환
2. **파이프라인 구성** — `pipe()` 또는 `createPipeline()`으로 가드 체이닝
3. **텍스트 실행** — `.run(text)` 호출로 결과 확인

## 가드 액션

| 액션 | 의미 |
|------|------|
| `allow` | 텍스트가 이 가드를 통과함 |
| `block` | 텍스트가 거부됨 |
| `warn` | 통과하지만 경고 플래그 |
| `override` | 텍스트가 수정됨 (예: PII 마스킹) |

## 다음 단계

- [YAML 설정](/guide/yaml-config) — 코드 없이 가드 구성
- [가드 목록](/guards/overview) — 33개 내장 가드 둘러보기
- [SDK 어댑터](/adapters/openai) — OpenAI, Vercel AI, LangChain 연동
