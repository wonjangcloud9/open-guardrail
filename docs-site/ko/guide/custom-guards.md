# 커스텀 가드

`Guard` 인터페이스를 구현하여 나만의 가드를 만들 수 있습니다.

## 팩토리 패턴

```typescript
import type { Guard } from 'open-guardrail-core';

interface MyGuardOptions {
  blockedWords: string[];
  action: 'block' | 'warn';
}

function myGuard(options: MyGuardOptions): Guard {
  return {
    name: 'my-guard',
    version: '1.0.0',
    description: '커스텀 금지어 가드',
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
        message: found ? `발견: ${found}` : undefined,
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
```

## 사용법

```typescript
import { pipe, promptInjection } from 'open-guardrail';

const pipeline = pipe(
  promptInjection({ action: 'block' }),
  myGuard({ blockedWords: ['스팸', '사기'], action: 'block' }),
);
```

## 플러그인으로 배포

여러 가드를 플러그인으로 묶어서 배포할 수 있습니다:

```typescript
import type { GuardPlugin } from 'open-guardrail-core';

export const myPlugin: GuardPlugin = {
  meta: {
    name: 'my-plugin',
    version: '1.0.0',
    description: '커스텀 가드 플러그인',
  },
  guards: {
    'my-guard': (config) => myGuard(config as MyGuardOptions),
  },
};
```

npm 패키지명 규칙: `open-guardrail-plugin-<이름>`
