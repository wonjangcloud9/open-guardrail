import { describe, it, expect } from 'vitest';
import { circuitBreaker } from '../src/circuit-breaker.js';
import type { Guard, GuardContext, GuardResult } from '../src/types.js';

const ctx: GuardContext = { pipelineType: 'input' };

function makeGuard(shouldThrow: boolean): Guard {
  return {
    name: 'test-guard',
    version: '0.1.0',
    description: 'test',
    category: 'custom',
    supportedStages: ['input'],
    async check(_text: string, _ctx: GuardContext): Promise<GuardResult> {
      if (shouldThrow) throw new Error('API failed');
      return { guardName: 'test-guard', passed: true, action: 'allow', latencyMs: 0 };
    },
  };
}

let callCount = 0;
function makeFlaky(failUntil: number): Guard {
  callCount = 0;
  return {
    name: 'flaky-guard',
    version: '0.1.0',
    description: 'test',
    category: 'custom',
    supportedStages: ['input'],
    async check(_text: string, _ctx: GuardContext): Promise<GuardResult> {
      callCount++;
      if (callCount <= failUntil) throw new Error('Temporary failure');
      return { guardName: 'flaky-guard', passed: true, action: 'allow', latencyMs: 0 };
    },
  };
}

describe('circuitBreaker', () => {
  it('passes through when guard succeeds', async () => {
    const cb = circuitBreaker(makeGuard(false));
    const result = await cb.check('hello', ctx);
    expect(result.passed).toBe(true);
  });

  it('opens circuit after threshold failures', async () => {
    const cb = circuitBreaker(makeGuard(true), { failureThreshold: 2 });
    await cb.check('test', ctx);
    await cb.check('test', ctx);
    const result = await cb.check('test', ctx);
    expect(result.details?.circuitState).toBe('open');
  });

  it('allows through on open with onOpen=allow', async () => {
    const cb = circuitBreaker(makeGuard(true), {
      failureThreshold: 1,
      onOpen: 'allow',
    });
    await cb.check('test', ctx);
    const result = await cb.check('test', ctx);
    expect(result.passed).toBe(true);
    expect(result.details?.circuitState).toBe('open');
  });

  it('blocks on open with onOpen=block', async () => {
    const cb = circuitBreaker(makeGuard(true), {
      failureThreshold: 1,
      onOpen: 'block',
    });
    await cb.check('test', ctx);
    const result = await cb.check('test', ctx);
    expect(result.passed).toBe(false);
  });

  it('recovers in half-open state', async () => {
    const cb = circuitBreaker(makeFlaky(2), {
      failureThreshold: 2,
      resetTimeoutMs: 10,
    });
    await cb.check('test', ctx);
    await cb.check('test', ctx);
    await new Promise((r) => setTimeout(r, 20));
    const result = await cb.check('test', ctx);
    expect(result.passed).toBe(true);
  });
});
