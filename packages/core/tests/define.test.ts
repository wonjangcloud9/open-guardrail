import { describe, it, expect } from 'vitest';
import { defineGuardrail } from '../src/define.js';
import type { Guard, GuardResult } from '../src/types.js';

function makeGuard(name: string, action: 'allow' | 'block' | 'warn' = 'allow'): Guard {
  return {
    name, version: '1.0.0', description: name, category: 'custom',
    supportedStages: ['input', 'output'],
    async check(): Promise<GuardResult> {
      return { guardName: name, passed: action !== 'block', action, latencyMs: 0 };
    },
  };
}

describe('defineGuardrail', () => {
  it('returns a callable function', async () => {
    const guard = defineGuardrail({ guards: [makeGuard('a')] });
    expect(typeof guard).toBe('function');
    const result = await guard('hello');
    expect(result.passed).toBe(true);
  });

  it('runs multiple guards', async () => {
    const guard = defineGuardrail({
      guards: [makeGuard('a'), makeGuard('b')],
    });
    const result = await guard('hello');
    expect(result.results).toHaveLength(2);
  });

  it('blocks when guard blocks', async () => {
    const guard = defineGuardrail({
      guards: [makeGuard('blocker', 'block')],
    });
    const result = await guard('hello');
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('supports nested guard arrays', async () => {
    const guard = defineGuardrail({
      guards: [[makeGuard('a'), makeGuard('b')], makeGuard('c')],
    });
    const result = await guard('hello');
    expect(result.results).toHaveLength(3);
  });

  it('exposes pipeline for advanced use', async () => {
    const guard = defineGuardrail({ guards: [makeGuard('a')] });
    expect(guard.pipeline).toBeDefined();
    await guard.pipeline.dispose();
  });

  it('passes metadata to pipeline', async () => {
    let receivedMeta: unknown;
    const metaGuard: Guard = {
      name: 'meta', version: '1.0.0', description: '', category: 'custom',
      supportedStages: ['input'],
      async check(_text, ctx) {
        receivedMeta = ctx.metadata;
        return { guardName: 'meta', passed: true, action: 'allow', latencyMs: 0 };
      },
    };
    const guard = defineGuardrail({ guards: [metaGuard] });
    await guard('hello', { userId: '123' });
    expect(receivedMeta).toEqual({ userId: '123' });
  });

  it('respects debug option without crashing', async () => {
    const guard = defineGuardrail({ guards: [makeGuard('a')], debug: true });
    const result = await guard('test');
    expect(result.passed).toBe(true);
  });
});
