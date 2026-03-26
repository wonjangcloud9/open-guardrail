import { describe, it, expect } from 'vitest';
import { guardCache } from '../src/guard-cache.js';
import type { Guard, GuardContext, GuardResult } from '../src/types.js';

const ctx: GuardContext = { pipelineType: 'input' };

let callCount = 0;
function makeCountingGuard(): Guard {
  callCount = 0;
  return {
    name: 'counting-guard',
    version: '0.1.0',
    description: 'test',
    category: 'custom',
    supportedStages: ['input'],
    async check(_text: string, _ctx: GuardContext): Promise<GuardResult> {
      callCount++;
      return { guardName: 'counting-guard', passed: true, action: 'allow', latencyMs: 1 };
    },
  };
}

describe('guardCache', () => {
  it('caches identical inputs', async () => {
    const cached = guardCache(makeCountingGuard(), { ttlMs: 5000 });
    await cached.check('hello', ctx);
    await cached.check('hello', ctx);
    await cached.check('hello', ctx);
    expect(callCount).toBe(1);
  });

  it('marks cached results', async () => {
    const cached = guardCache(makeCountingGuard(), { ttlMs: 5000 });
    await cached.check('test', ctx);
    const result = await cached.check('test', ctx);
    expect(result.details?.fromCache).toBe(true);
    expect(result.latencyMs).toBe(0);
  });

  it('does not cache different inputs', async () => {
    const cached = guardCache(makeCountingGuard(), { ttlMs: 5000 });
    await cached.check('hello', ctx);
    await cached.check('world', ctx);
    expect(callCount).toBe(2);
  });

  it('expires cached entries after TTL', async () => {
    const cached = guardCache(makeCountingGuard(), { ttlMs: 10 });
    await cached.check('test', ctx);
    await new Promise((r) => setTimeout(r, 20));
    await cached.check('test', ctx);
    expect(callCount).toBe(2);
  });

  it('respects maxSize', async () => {
    const cached = guardCache(makeCountingGuard(), { maxSize: 2, ttlMs: 5000 });
    await cached.check('a', ctx);
    await cached.check('b', ctx);
    await cached.check('c', ctx);
    expect(callCount).toBe(3);
  });
});
