## Task 5b: Core Package — Guard Registry + OpenGuardrail Class

**Files:**
- Create: `packages/core/src/registry.ts`
- Create: `packages/core/src/open-guardrail.ts`
- Create: `packages/core/tests/registry.test.ts`
- Create: `packages/core/tests/open-guardrail.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing tests for registry**

Create `packages/core/tests/registry.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GuardRegistry } from '../src/registry.js';
import type { Guard, GuardResult } from '../src/types.js';

const dummyGuard: Guard = {
  name: 'dummy', version: '1.0.0', description: 'test',
  category: 'custom', supportedStages: ['input', 'output'],
  async check(): Promise<GuardResult> {
    return { guardName: 'dummy', passed: true, action: 'allow', latencyMs: 0 };
  },
};

describe('GuardRegistry', () => {
  it('registers and resolves a guard factory', () => {
    const registry = new GuardRegistry();
    registry.register('dummy', () => dummyGuard);
    const guard = registry.resolve('dummy', {});
    expect(guard.name).toBe('dummy');
  });

  it('throws on unknown guard type', () => {
    const registry = new GuardRegistry();
    expect(() => registry.resolve('nope', {})).toThrow(/unknown guard/i);
  });

  it('lists registered guard types', () => {
    const registry = new GuardRegistry();
    registry.register('a', () => dummyGuard);
    registry.register('b', () => dummyGuard);
    expect(registry.list()).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test`
Expected: FAIL

- [ ] **Step 3: Implement registry.ts**

Create `packages/core/src/registry.ts`:

```typescript
import type { Guard } from './types.js';

type GuardFactoryFn = (config: Record<string, unknown>) => Guard;

export class GuardRegistry {
  private factories = new Map<string, GuardFactoryFn>();

  register(type: string, factory: GuardFactoryFn): void {
    this.factories.set(type, factory);
  }

  resolve(type: string, config: Record<string, unknown>): Guard {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown guard type: "${type}". Registered: ${this.list().join(', ')}`);
    }
    return factory(config);
  }

  has(type: string): boolean {
    return this.factories.has(type);
  }

  list(): string[] {
    return [...this.factories.keys()];
  }
}
```

- [ ] **Step 4: Run registry tests**

Run: `cd packages/core && pnpm test -- registry`
Expected: PASS

- [ ] **Step 5: Write failing tests for OpenGuardrail**

Create `packages/core/tests/open-guardrail.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { OpenGuardrail } from '../src/open-guardrail.js';
import type { Guard, GuardResult } from '../src/types.js';

const dummyGuard: Guard = {
  name: 'keyword', version: '1.0.0', description: 'test',
  category: 'security', supportedStages: ['input', 'output'],
  async check(text: string): Promise<GuardResult> {
    const blocked = text.includes('bad');
    return { guardName: 'keyword', passed: !blocked, action: blocked ? 'block' : 'allow', latencyMs: 0 };
  },
};

describe('OpenGuardrail', () => {
  it('builds pipeline from YAML config string', async () => {
    const yaml = `
version: "1"
pipelines:
  input:
    mode: fail-fast
    guards:
      - type: keyword
        action: block
        config:
          denied: ["bad"]
`;
    const og = OpenGuardrail.fromString(yaml);
    og.registerGuard('keyword', () => dummyGuard);
    const result = await og.run('bad word', 'input');
    expect(result.passed).toBe(false);
  });

  it('builds from object (Edge/browser)', () => {
    const config = {
      version: '1' as const,
      pipelines: {
        input: {
          mode: 'fail-fast' as const,
          onError: 'block' as const,
          timeoutMs: 5000,
          guards: [{ type: 'keyword', action: 'block' as const, config: {} }],
        },
      },
    };
    const og = OpenGuardrail.fromObject(config);
    og.registerGuard('keyword', () => dummyGuard);
    expect(og).toBeDefined();
  });

  it('runs output pipeline', async () => {
    const yaml = `
version: "1"
pipelines:
  output:
    guards:
      - type: keyword
        action: block
`;
    const og = OpenGuardrail.fromString(yaml);
    og.registerGuard('keyword', () => dummyGuard);
    const result = await og.run('safe text', 'output');
    expect(result.passed).toBe(true);
  });

  it('throws if pipeline type not configured', async () => {
    const yaml = `
version: "1"
pipelines:
  input:
    guards:
      - type: keyword
        action: block
`;
    const og = OpenGuardrail.fromString(yaml);
    og.registerGuard('keyword', () => dummyGuard);
    await expect(og.run('text', 'output')).rejects.toThrow(/not configured/i);
  });
});
```

- [ ] **Step 6: Implement open-guardrail.ts**

Create `packages/core/src/open-guardrail.ts`:

```typescript
import type { PipelineResult, PipelineStage, RawConfig } from './types.js';
import { configSchema, type RawPipelineConfig } from './config-schema.js';
import { Pipeline } from './pipeline.js';
import { GuardRegistry } from './registry.js';
import { loadConfigFromString } from './config-loader.js';

export class OpenGuardrail {
  private config: RawConfig;
  private registry = new GuardRegistry();
  private pipelines = new Map<PipelineStage, Pipeline>();

  private constructor(config: RawConfig) {
    this.config = config;
  }

  static fromString(yamlOrJson: string): OpenGuardrail {
    const config = loadConfigFromString(yamlOrJson);
    return new OpenGuardrail(config);
  }

  static fromObject(obj: unknown): OpenGuardrail {
    const result = configSchema.safeParse(obj);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.issues.map(i => i.message).join(', ')}`);
    }
    return new OpenGuardrail(result.data);
  }

  static async fromConfig(filePath: string): Promise<OpenGuardrail> {
    const { readFileSync } = await import('node:fs');
    const content = readFileSync(filePath, 'utf-8');
    return OpenGuardrail.fromString(content);
  }

  registerGuard(type: string, factory: (config: Record<string, unknown>) => import('./types.js').Guard): void {
    this.registry.register(type, factory);
  }

  async run(text: string, stage: PipelineStage = 'input'): Promise<PipelineResult> {
    const pipeline = this.getOrCreatePipeline(stage);
    return pipeline.run(text);
  }

  async dispose(): Promise<void> {
    for (const pipeline of this.pipelines.values()) {
      await pipeline.dispose();
    }
  }

  private getOrCreatePipeline(stage: PipelineStage): Pipeline {
    if (this.pipelines.has(stage)) return this.pipelines.get(stage)!;

    const pipelineConfig = this.config.pipelines[stage];
    if (!pipelineConfig) {
      throw new Error(`Pipeline "${stage}" is not configured`);
    }

    const guards = pipelineConfig.guards.map((g) => this.registry.resolve(g.type, {
      action: g.action,
      threshold: g.threshold,
      ...((g.config as Record<string, unknown>) ?? {}),
    }));

    const pipeline = new Pipeline({
      type: stage,
      mode: pipelineConfig.mode,
      onError: pipelineConfig.onError,
      timeoutMs: pipelineConfig.timeoutMs,
      guards,
    });

    this.pipelines.set(stage, pipeline);
    return pipeline;
  }
}
```

- [ ] **Step 7: Update index.ts exports**

Add to `packages/core/src/index.ts`:

```typescript
export { GuardRegistry } from './registry.js';
export { OpenGuardrail } from './open-guardrail.js';
```

- [ ] **Step 8: Run all tests**

Run: `cd packages/core && pnpm test`
Expected: all PASS

- [ ] **Step 9: Commit**

```bash
git add packages/core/ && git commit -m "feat(core): add GuardRegistry and OpenGuardrail config-driven engine"
```
