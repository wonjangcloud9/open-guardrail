# Risk-Based Routing

Route inputs to different guard pipelines based on risk level using `GuardRouter`.

## Usage

```typescript
import { GuardRouter, pipe, promptInjection, pii, toxicity, keyword } from 'open-guardrail';

const router = new GuardRouter({
  classifier: async (text) => {
    // Your risk classification logic
    if (text.includes('ignore') || text.includes('system prompt')) return 'high';
    if (text.length > 500) return 'medium';
    return 'low';
  },
  routes: {
    low: pipe(keyword({ denied: ['hack'], action: 'block' })),
    medium: pipe(
      promptInjection({ action: 'block' }),
      keyword({ denied: ['hack'], action: 'block' }),
    ),
    high: pipe(
      promptInjection({ action: 'block' }),
      pii({ entities: ['email', 'phone', 'ssn'], action: 'mask' }),
      toxicity({ action: 'block' }),
    ),
  },
});

const result = await router.route('user input');
```

## When to Use

- **Cost optimization** — skip expensive guards for clearly safe inputs
- **Latency reduction** — fast path for low-risk inputs
- **Tiered security** — stricter checks for high-risk inputs
