## Task 4: Core Package — Pipeline

**Files:**
- Create: `packages/core/src/pipeline.ts`
- Create: `packages/core/tests/pipeline.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/tests/pipeline.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createPipeline, pipe } from '../src/pipeline.js';
import type { Guard, GuardResult, GuardContext } from '../src/types.js';

function makeGuard(name: string, result: Partial<GuardResult> = {}): Guard {
  return {
    name,
    version: '1.0.0',
    description: `test guard ${name}`,
    category: 'custom',
    supportedStages: ['input', 'output'],
    check: vi.fn(async (): Promise<GuardResult> => ({
      guardName: name,
      passed: true,
      action: 'allow',
      latencyMs: 1,
      ...result,
    })),
  };
}

describe('Pipeline', () => {
  describe('createPipeline', () => {
    it('runs all guards and returns aggregated result', async () => {
      const g1 = makeGuard('g1');
      const g2 = makeGuard('g2');
      const p = createPipeline({ guards: [g1, g2], mode: 'run-all' });
      const result = await p.run('hello');
      expect(result.passed).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.action).toBe('allow');
    });

    it('fail-fast stops on first block', async () => {
      const g1 = makeGuard('g1', { passed: false, action: 'block' });
      const g2 = makeGuard('g2');
      const p = createPipeline({ guards: [g1, g2], mode: 'fail-fast' });
      const result = await p.run('hello');
      expect(result.passed).toBe(false);
      expect(result.action).toBe('block');
      expect(result.results).toHaveLength(1);
      expect(g2.check).not.toHaveBeenCalled();
    });

    it('run-all executes all guards even on block', async () => {
      const g1 = makeGuard('g1', { passed: false, action: 'block' });
      const g2 = makeGuard('g2', { passed: true, action: 'warn' });
      const p = createPipeline({ guards: [g1, g2], mode: 'run-all' });
      const result = await p.run('hello');
      expect(result.passed).toBe(false);
      expect(result.action).toBe('block');
      expect(result.results).toHaveLength(2);
    });

    it('respects action priority: block > override > warn > allow', async () => {
      const g1 = makeGuard('g1', { passed: true, action: 'warn' });
      const g2 = makeGuard('g2', { passed: true, action: 'allow' });
      const p = createPipeline({ guards: [g1, g2], mode: 'run-all' });
      const result = await p.run('hello');
      expect(result.action).toBe('warn');
      expect(result.passed).toBe(true);
    });

    it('dryRun mode always passes', async () => {
      const g1 = makeGuard('g1', { passed: false, action: 'block' });
      const p = createPipeline({ guards: [g1], dryRun: true });
      const result = await p.run('hello');
      expect(result.passed).toBe(true);
      expect(result.metadata.dryRun).toBe(true);
      expect(result.results[0].action).toBe('block');
    });

    it('handles guard exception with onError=block (default)', async () => {
      const g1: Guard = {
        name: 'bad', version: '1.0.0', description: 'throws',
        category: 'custom', supportedStages: ['input'],
        check: async () => { throw new Error('boom'); },
      };
      const p = createPipeline({ guards: [g1] });
      const result = await p.run('hello');
      expect(result.passed).toBe(false);
      expect(result.results[0].error?.code).toBe('EXCEPTION');
    });

    it('handles guard exception with onError=allow', async () => {
      const g1: Guard = {
        name: 'bad', version: '1.0.0', description: 'throws',
        category: 'custom', supportedStages: ['input'],
        check: async () => { throw new Error('boom'); },
      };
      const p = createPipeline({ guards: [g1], onError: 'allow' });
      const result = await p.run('hello');
      expect(result.passed).toBe(true);
      expect(result.results[0].error?.code).toBe('EXCEPTION');
    });

    it('applies override text to output', async () => {
      const g1 = makeGuard('g1', {
        action: 'override',
        overrideText: 'redacted',
        passed: true,
      });
      const p = createPipeline({ guards: [g1], mode: 'run-all' });
      const result = await p.run('secret data');
      expect(result.output).toBe('redacted');
    });

    it('calls init() on guards that have it', async () => {
      const initFn = vi.fn(async () => {});
      const g1 = { ...makeGuard('g1'), init: initFn };
      const p = createPipeline({ guards: [g1] });
      await p.run('hello');
      expect(initFn).toHaveBeenCalledOnce();
    });
  });

  describe('pipe()', () => {
    it('is shorthand for createPipeline with defaults', async () => {
      const g1 = makeGuard('g1');
      const result = await pipe(g1).run('hello');
      expect(result.passed).toBe(true);
      expect(result.metadata.pipelineType).toBe('input');
      expect(result.metadata.mode).toBe('fail-fast');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test`
Expected: FAIL — module not found

- [ ] **Step 3: Implement pipeline.ts**

Create `packages/core/src/pipeline.ts`:

```typescript
import type {
  Guard, GuardAction, GuardContext, GuardResult,
  PipelineOptions, PipelineResult, PipelineMode,
  OnErrorAction, PipelineStage,
} from './types.js';
import { GuardError } from './errors.js';
import { EventBus } from './event-bus.js';

const ACTION_PRIORITY: Record<GuardAction, number> = {
  block: 4,
  override: 3,
  warn: 2,
  allow: 1,
};

export class Pipeline {
  private guards: Guard[];
  private type: PipelineStage;
  private mode: PipelineMode;
  private onError: OnErrorAction;
  private timeoutMs: number;
  private dryRun: boolean;
  private eventBus: EventBus;
  private initialized = false;

  constructor(options: PipelineOptions, eventBus?: EventBus) {
    this.guards = options.guards;
    this.type = options.type ?? 'input';
    this.mode = options.mode ?? 'fail-fast';
    this.onError = options.onError ?? 'block';
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.dryRun = options.dryRun ?? false;
    this.eventBus = eventBus ?? new EventBus();
  }

  on(event: Parameters<EventBus['on']>[0], handler: Parameters<EventBus['on']>[1]): void {
    this.eventBus.on(event, handler);
  }

  async run(text: string, metadata?: Record<string, unknown>): Promise<PipelineResult> {
    const start = performance.now();
    if (!this.initialized) {
      await this.initGuards();
      this.initialized = true;
    }

    const results: GuardResult[] = [];
    let currentText = text;

    for (const guard of this.guards) {
      const ctx: GuardContext = {
        pipelineType: this.type,
        previousResults: [...results],
        metadata,
        dryRun: this.dryRun,
      };

      await this.eventBus.emit('guard:before', { guardName: guard.name, text: currentText });

      const result = await this.executeGuard(guard, currentText, ctx);
      results.push(result);

      await this.eventBus.emit('guard:after', { guardName: guard.name, text: currentText, result });

      if (result.action === 'override' && result.overrideText) {
        currentText = result.overrideText;
      }

      if (result.action === 'block') {
        await this.eventBus.emit('guard:blocked', { guardName: guard.name, text: currentText, result });
        if (this.mode === 'fail-fast' && !this.dryRun) break;
      }
    }

    const aggregatedAction = this.aggregateAction(results);
    const passed = this.dryRun || aggregatedAction !== 'block';

    return {
      passed,
      action: aggregatedAction,
      results,
      input: text,
      output: currentText !== text ? currentText : undefined,
      totalLatencyMs: Math.round(performance.now() - start),
      metadata: {
        pipelineType: this.type,
        mode: this.mode,
        dryRun: this.dryRun,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async dispose(): Promise<void> {
    for (const guard of this.guards) {
      if (guard.dispose) await guard.dispose();
    }
    this.eventBus.removeAll();
  }

  private async initGuards(): Promise<void> {
    for (const guard of this.guards) {
      if (guard.init) await guard.init();
    }
  }

  private async executeGuard(guard: Guard, text: string, ctx: GuardContext): Promise<GuardResult> {
    const start = performance.now();
    try {
      const result = await Promise.race([
        guard.check(text, ctx),
        this.createTimeout(guard.name),
      ]);
      return result;
    } catch (err) {
      const guardError = err instanceof GuardError
        ? err
        : GuardError.fromException(guard.name, err as Error);

      await this.eventBus.emit('guard:error', { guardName: guard.name, error: guardError });

      return {
        guardName: guard.name,
        passed: this.onError === 'allow',
        action: this.onError,
        latencyMs: Math.round(performance.now() - start),
        error: guardError.toJSON(),
        message: guardError.message,
      };
    }
  }

  private createTimeout(guardName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(GuardError.timeout(guardName, this.timeoutMs)), this.timeoutMs);
    });
  }

  private aggregateAction(results: GuardResult[]): GuardAction {
    if (results.length === 0) return 'allow';
    return results.reduce<GuardAction>((highest, r) => {
      return ACTION_PRIORITY[r.action] > ACTION_PRIORITY[highest] ? r.action : highest;
    }, 'allow');
  }
}

export function createPipeline(options: PipelineOptions, eventBus?: EventBus): Pipeline {
  return new Pipeline(options, eventBus);
}

export function pipe(...guards: Guard[]): Pipeline {
  return createPipeline({ guards });
}
```

- [ ] **Step 4: Create index.ts to export everything**

Create `packages/core/src/index.ts`:

```typescript
export type {
  Guard, GuardAction, GuardCategory, GuardContext,
  GuardResult, GuardErrorInfo, GuardFactory,
  PipelineOptions, PipelineResult, PipelineMode,
  PipelineStage, OnErrorAction,
} from './types.js';
export { GuardError } from './errors.js';
export { EventBus } from './event-bus.js';
export type { GuardEventType, GuardEventHandler } from './event-bus.js';
export { Pipeline, createPipeline, pipe } from './pipeline.js';
```

- [ ] **Step 5: Run all tests**

Run: `cd packages/core && pnpm test`
Expected: all Pipeline + EventBus + Errors tests PASS

- [ ] **Step 6: Build the package**

Run: `cd packages/core && pnpm build`
Expected: `dist/` with ESM + CJS + .d.ts

- [ ] **Step 7: Commit**

```bash
git add packages/core/ && git commit -m "feat(core): add Pipeline with fail-fast/run-all, timeout, dryRun"
```
