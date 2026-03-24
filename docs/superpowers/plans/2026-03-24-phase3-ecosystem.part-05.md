## Task 4: Risk-Based Router

**Files:**
- Create: `packages/core/src/router.ts`
- Create: `packages/core/tests/router.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/tests/router.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GuardRouter } from '../src/router.js';
import { Pipeline } from '../src/pipeline.js';
import type { Guard, GuardResult } from '../src/types.js';

function makeGuard(name: string, block = false): Guard {
  return {
    name, version: '1.0.0', description: name, category: 'custom',
    supportedStages: ['input', 'output'],
    async check(): Promise<GuardResult> {
      return { guardName: name, passed: !block, action: block ? 'block' : 'allow', latencyMs: 0 };
    },
  };
}

describe('GuardRouter', () => {
  it('routes to correct pipeline based on classifier', async () => {
    const router = new GuardRouter({
      classifier: (text) => text.length < 10 ? 'low' : 'high',
      routes: {
        low: new Pipeline({ guards: [makeGuard('fast')] }),
        high: new Pipeline({ guards: [makeGuard('strict'), makeGuard('extra')] }),
      },
    });

    const short = await router.run('hi');
    expect(short.results).toHaveLength(1);
    expect(short.results[0].guardName).toBe('fast');

    const long = await router.run('this is a longer input text');
    expect(long.results).toHaveLength(2);
  });

  it('uses default route for unmatched classification', async () => {
    const router = new GuardRouter({
      classifier: () => 'unknown',
      routes: { low: new Pipeline({ guards: [makeGuard('low')] }) },
      defaultRoute: new Pipeline({ guards: [makeGuard('default')] }),
    });
    const result = await router.run('test');
    expect(result.results[0].guardName).toBe('default');
  });

  it('throws if no matching route and no default', async () => {
    const router = new GuardRouter({
      classifier: () => 'unknown',
      routes: { low: new Pipeline({ guards: [makeGuard('low')] }) },
    });
    await expect(router.run('test')).rejects.toThrow(/no route/i);
  });

  it('includes route info in metadata', async () => {
    const router = new GuardRouter({
      classifier: () => 'high',
      routes: { high: new Pipeline({ guards: [makeGuard('g')] }) },
    });
    const result = await router.run('test');
    expect(result.metadata).toBeDefined();
  });
});
```

- [ ] **Step 2: Implement router.ts**

Create `packages/core/src/router.ts`:

```typescript
import type { PipelineResult } from './types.js';
import { Pipeline } from './pipeline.js';

type RiskLevel = string;
type Classifier = (text: string) => RiskLevel;

interface RouterOptions {
  classifier: Classifier;
  routes: Record<RiskLevel, Pipeline>;
  defaultRoute?: Pipeline;
}

export class GuardRouter {
  private classifier: Classifier;
  private routes: Record<RiskLevel, Pipeline>;
  private defaultRoute?: Pipeline;

  constructor(options: RouterOptions) {
    this.classifier = options.classifier;
    this.routes = options.routes;
    this.defaultRoute = options.defaultRoute;
  }

  async run(text: string, metadata?: Record<string, unknown>): Promise<PipelineResult> {
    const level = this.classifier(text);
    const pipeline = this.routes[level] ?? this.defaultRoute;

    if (!pipeline) {
      throw new Error(`No route for risk level "${level}" and no default route configured`);
    }

    const result = await pipeline.run(text, metadata);
    return {
      ...result,
      metadata: { ...result.metadata, riskLevel: level },
    };
  }
}

export function createRouter(options: RouterOptions): GuardRouter {
  return new GuardRouter(options);
}
```

- [ ] **Step 3: Export from index.ts**

Add to `packages/core/src/index.ts`:
```typescript
export { GuardRouter, createRouter } from './router.js';
```

- [ ] **Step 4: Run tests**

Run: `cd packages/core && pnpm test`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/
git commit -m "feat(core): add GuardRouter for risk-based pipeline routing"
```
