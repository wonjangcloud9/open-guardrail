## Feature 5: Risk-Based Routing

### Problem
모든 요청에 동일 가드 적용 = 불필요한 레이턴시.
Low-risk 쿼리에 3계층 검증은 낭비.

### Design
```typescript
import { createRouter } from 'open-guardrail';

const router = createRouter({
  classifier: (text) => {
    if (text.length < 20) return 'low';
    if (/ignore|system|prompt/i.test(text)) return 'high';
    return 'medium';
  },
  routes: {
    low: pipe(keyword({ denied: ['hack'], action: 'block' })),
    medium: pipe(promptInjection({ action: 'block' }), pii({ action: 'mask' })),
    high: pipe(
      promptInjection({ action: 'block' }),
      pii({ action: 'mask' }),
      toxicity({ action: 'block' }),
      dataLeakage({ action: 'block' }),
    ),
  },
});

const result = await router.run('hello'); // low route → fast
```

### Files
- Create: `packages/core/src/router.ts`
- Create: `packages/core/tests/router.test.ts`
- Modify: `packages/core/src/index.ts`

## Feature 6: Korean AI Basic Act Preset

### Design
한국 AI 기본법(2026.1.22 시행) 요구사항:
- 고영향 AI 편향 방지 → bias guard
- 투명성/설명 의무 → audit logger
- 인간 감독 → dryRun mode + warn actions
- 개인정보 보호 → pii-kr + pipa

```yaml
# presets/ai-basic-act-kr.yaml
version: "1"
pipelines:
  input:
    mode: run-all
    guards:
      - type: prompt-injection
        action: block
      - type: pii-kr
        action: mask
      - type: bias
        action: warn
      - type: toxicity
        action: block
      - type: language
        action: warn
        config:
          allowed: [ko, en]
  output:
    mode: run-all
    guards:
      - type: bias
        action: warn
      - type: pii-kr
        action: mask
      - type: toxicity
        action: block
      - type: sentiment
        action: warn
```

### Files
- Create: `presets/ai-basic-act-kr.yaml`
