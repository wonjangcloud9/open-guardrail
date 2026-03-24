## Task 5: Korean AI Basic Act Preset + update umbrella + README

**Files:**
- Create: `presets/ai-basic-act-kr.yaml`
- Modify: `packages/open-guardrail/src/index.ts` (add new exports)
- Modify: `packages/open-guardrail/tests/integration.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Create presets/ai-basic-act-kr.yaml**

```yaml
version: "1"
pipelines:
  input:
    mode: run-all
    onError: warn
    guards:
      - type: prompt-injection
        action: block
      - type: pii-kr
        action: mask
        config:
          entities: [resident-id, phone, email, passport, driver-license]
      - type: bias
        action: warn
        config:
          categories: [gender, racial, religious, age]
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
        config:
          entities: [resident-id, phone, email]
      - type: toxicity
        action: block
      - type: sentiment
        action: warn
```

- [ ] **Step 2: Update umbrella index.ts**

Add to `packages/open-guardrail/src/index.ts`:

```typescript
// Core — new exports
export { StreamingPipeline } from 'open-guardrail-core';
export { AuditLogger, type AuditEntry } from 'open-guardrail-core';
export { GuardRouter, createRouter } from 'open-guardrail-core';

// Guards — new export
export { toolCallValidator } from 'open-guardrail-guards';
```

- [ ] **Step 3: Update umbrella integration tests**

Add to `packages/open-guardrail/tests/integration.test.ts`:

```typescript
import { StreamingPipeline, AuditLogger, GuardRouter, createRouter, toolCallValidator } from '../src/index.js';

describe('Phase 3 exports', () => {
  it('exports StreamingPipeline', () => {
    expect(StreamingPipeline).toBeDefined();
  });

  it('exports AuditLogger', () => {
    expect(AuditLogger).toBeDefined();
    const logger = new AuditLogger();
    expect(typeof logger.record).toBe('function');
  });

  it('exports GuardRouter + createRouter', () => {
    expect(GuardRouter).toBeDefined();
    expect(typeof createRouter).toBe('function');
  });

  it('exports toolCallValidator', () => {
    expect(typeof toolCallValidator).toBe('function');
  });
});
```

- [ ] **Step 4: Update README.md**

Add new sections:
- Streaming Pipeline usage
- Tool Call Validator usage
- Audit Logger usage
- Risk-Based Routing usage
- New preset: ai-basic-act-kr

- [ ] **Step 5: Build + test all**

Run: `pnpm build && pnpm test`
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add presets/ packages/ README.md
git commit -m "feat: Phase 3 — streaming, tool-call-validator, audit-logger, router, AI 기본법 프리셋"
```

- [ ] **Step 7: Version bump to v0.7.0**

Update all package.json versions to 0.7.0.

```bash
git add packages/
git commit -m "chore: bump all packages to v0.7.0 — Phase 3 Ecosystem"
```
