## Task 11: Presets + Integration Test + README

**Files:**
- Create: `presets/default.yaml`
- Create: `presets/strict.yaml`
- Create: `packages/core/tests/integration.test.ts`
- Create: `README.md`

- [ ] **Step 1: Copy presets to root**

Copy `packages/cli/src/templates/default.yaml` → `presets/default.yaml`
Copy `packages/cli/src/templates/strict.yaml` → `presets/strict.yaml`

- [ ] **Step 2: Write integration test**

Create `packages/core/tests/integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createPipeline, pipe } from '../src/pipeline.js';
import type { Guard, GuardResult, GuardContext } from '../src/types.js';

// Simulate real guard behavior
const blockBadWords: Guard = {
  name: 'keyword', version: '1.0.0', description: 'test',
  category: 'security', supportedStages: ['input', 'output'],
  async check(text: string): Promise<GuardResult> {
    const bad = ['hack', 'exploit'];
    const found = bad.some((w) => text.toLowerCase().includes(w));
    return { guardName: 'keyword', passed: !found, action: found ? 'block' : 'allow', latencyMs: 0 };
  },
};

const maskEmail: Guard = {
  name: 'pii', version: '1.0.0', description: 'test',
  category: 'privacy', supportedStages: ['input', 'output'],
  async check(text: string): Promise<GuardResult> {
    const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const hasEmail = emailRe.test(text);
    if (!hasEmail) return { guardName: 'pii', passed: true, action: 'allow', latencyMs: 0 };
    return {
      guardName: 'pii', passed: true, action: 'override',
      overrideText: text.replace(emailRe, '[EMAIL]'), latencyMs: 0,
    };
  },
};

describe('Integration', () => {
  it('full pipeline: block bad input', async () => {
    const p = createPipeline({ type: 'input', guards: [blockBadWords, maskEmail] });
    const result = await p.run('how to hack a system');
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('full pipeline: mask PII and pass', async () => {
    const p = createPipeline({ type: 'input', mode: 'run-all', guards: [blockBadWords, maskEmail] });
    const result = await p.run('contact user@test.com for info');
    expect(result.passed).toBe(true);
    expect(result.output).toBe('contact [EMAIL] for info');
  });

  it('pipe() shorthand works end-to-end', async () => {
    const result = await pipe(blockBadWords).run('hello world');
    expect(result.passed).toBe(true);
  });

  it('event hooks fire correctly', async () => {
    const events: string[] = [];
    const p = createPipeline({ guards: [blockBadWords] });
    p.on('guard:before', async () => { events.push('before'); });
    p.on('guard:after', async () => { events.push('after'); });
    await p.run('safe text');
    expect(events).toEqual(['before', 'after']);
  });

  it('event hooks fire blocked event', async () => {
    let blocked = false;
    const p = createPipeline({ guards: [blockBadWords] });
    p.on('guard:blocked', async () => { blocked = true; });
    await p.run('exploit vulnerability');
    expect(blocked).toBe(true);
  });
});
```

- [ ] **Step 3: Run integration tests**

Run: `cd packages/core && pnpm test`
Expected: all PASS

- [ ] **Step 4: Create README.md**

Create `README.md`:

```markdown
# open-guardrail

Open-source guardrail engine for LLM applications.

Provider-agnostic text input/output middleware.
Works in Node.js, browsers, and edge runtimes.

## Install

npm install open-guardrail

## Quick Start

import { pipe, keyword, pii, promptInjection } from 'open-guardrail';

const result = await pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email', 'phone'], action: 'mask' }),
  keyword({ denied: ['hack', 'exploit'], action: 'block' }),
).run('user input text here');

if (!result.passed) {
  console.log('Blocked:', result.action);
}

## YAML Config

Create guardrail.yaml:

version: "1"
pipelines:
  input:
    mode: fail-fast
    guards:
      - type: prompt-injection
        action: block
      - type: pii
        action: mask
        config:
          entities: [email, phone]

Then load it:

import { OpenGuardrail } from 'open-guardrail';
const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
const result = await engine.run(text);

## CLI

npx @open-guardrail/cli init          # create guardrail.yaml
npx @open-guardrail/cli validate      # validate config

## Built-in Guards

- prompt-injection — detect jailbreak attempts
- regex — custom pattern matching (ReDoS safe)
- keyword — deny/allow keyword lists
- pii — detect and mask PII (email, phone, card, SSN)
- word-count — min/max word/char limits
- schema — JSON schema validation

## License

MIT
```

- [ ] **Step 5: Run full monorepo build + test**

Run: `pnpm build && pnpm test`
Expected: all packages build, all tests PASS

- [ ] **Step 6: Commit**

```bash
git add presets/ README.md packages/core/tests/integration.test.ts
git commit -m "feat: add presets, integration tests, and README for v0.1.0"
```

---

## Task 12: Final — CI + npm publish prep

**Files:**
- Create: `.github/workflows/ci.yaml`
- Modify: root `package.json` (add publish scripts)

- [ ] **Step 1: Create GitHub Actions CI**

Create `.github/workflows/ci.yaml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
```

- [ ] **Step 2: Verify CI config is valid**

Run: `cat .github/workflows/ci.yaml`
Check YAML syntax is correct.

- [ ] **Step 3: Final full test run**

Run: `pnpm build && pnpm test`
Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add .github/ && git commit -m "ci: add GitHub Actions workflow for Node 18/20/22"
```

- [ ] **Step 5: Tag v0.1.0**

```bash
git tag v0.1.0
```

Phase 1 complete. Ready for npm publish.
