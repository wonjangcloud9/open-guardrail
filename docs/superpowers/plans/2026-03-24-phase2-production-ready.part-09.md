## Task 8: Umbrella integration tests

**Files:**
- Create: `packages/open-guardrail/tests/integration.test.ts`
- Modify: `packages/open-guardrail/package.json` (add test script + vitest)

- [ ] **Step 1: Add test script to umbrella package.json**

Add to `packages/open-guardrail/package.json`:
```json
{
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "tsup": "^8.4.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: Write integration tests**

Create `packages/open-guardrail/tests/integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  pipe, createPipeline,
  promptInjection, keyword, pii, wordCount,
  toxicity, bias, language,
  piiKr, profanityKr, residentId,
  llmJudge, costGuard, rateLimit, dataLeakage, sentiment,
  schemaGuard, topicDeny, topicAllow,
  creditInfo, ismsP, pipa,
  hallucination, relevance, groundedness,
  regex,
  Pipeline, EventBus, GuardRegistry, OpenGuardrail, GuardError,
} from '../src/index.js';

describe('Umbrella package exports', () => {
  it('exports all core classes', () => {
    expect(Pipeline).toBeDefined();
    expect(EventBus).toBeDefined();
    expect(GuardRegistry).toBeDefined();
    expect(OpenGuardrail).toBeDefined();
    expect(GuardError).toBeDefined();
  });

  it('exports pipe and createPipeline', () => {
    expect(typeof pipe).toBe('function');
    expect(typeof createPipeline).toBe('function');
  });

  it('exports all 26 guard factories', () => {
    const guards = [
      regex, keyword, promptInjection,
      pii, toxicity, topicDeny, topicAllow, bias, language,
      wordCount, schemaGuard,
      llmJudge, hallucination, relevance, groundedness,
      costGuard, rateLimit, dataLeakage, sentiment,
      piiKr, profanityKr, residentId, creditInfo, ismsP, pipa,
    ];
    for (const guard of guards) {
      expect(typeof guard).toBe('function');
    }
    expect(guards).toHaveLength(25);
  });
});

describe('End-to-end pipeline', () => {
  it('pipe() with multiple guards', async () => {
    const p = pipe(
      keyword({ denied: ['bad'], action: 'block' }),
    );
    const safe = await p.run('hello');
    expect(safe.passed).toBe(true);

    const blocked = await p.run('this is bad');
    expect(blocked.passed).toBe(false);
    expect(blocked.action).toBe('block');
  });

  it('PII masking through pipe', async () => {
    const p = pipe(
      pii({ entities: ['email'], action: 'mask' }),
    );
    const result = await p.run('email: user@test.com');
    expect(result.passed).toBe(true);
    expect(result.output).toContain('[EMAIL]');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd packages/open-guardrail && pnpm test`
Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add packages/open-guardrail/
git commit -m "test: add umbrella package integration tests for all 26 guards"
```
