import { describe, it, expect, vi } from 'vitest';
import { rateLimit } from '../src/rate-limit.js';

describe('rate-limit', () => {
  it('allows requests within limit', async () => {
    const guard = rateLimit({
      action: 'block',
      maxRequests: 3,
      windowMs: 1000,
    });
    const ctx = { pipelineType: 'input' as const };
    const r1 = await guard.check('a', ctx);
    const r2 = await guard.check('b', ctx);
    expect(r1.passed).toBe(true);
    expect(r2.passed).toBe(true);
  });

  it('blocks when limit exceeded', async () => {
    const guard = rateLimit({
      action: 'block',
      maxRequests: 2,
      windowMs: 10000,
    });
    const ctx = { pipelineType: 'input' as const };
    await guard.check('a', ctx);
    await guard.check('b', ctx);
    const r3 = await guard.check('c', ctx);
    expect(r3.passed).toBe(false);
    expect(r3.action).toBe('block');
  });

  it('resets after window expires', async () => {
    vi.useFakeTimers();
    const guard = rateLimit({
      action: 'block',
      maxRequests: 1,
      windowMs: 100,
    });
    const ctx = { pipelineType: 'input' as const };
    await guard.check('a', ctx);
    const blocked = await guard.check('b', ctx);
    expect(blocked.passed).toBe(false);

    vi.advanceTimersByTime(150);
    const allowed = await guard.check('c', ctx);
    expect(allowed.passed).toBe(true);
    vi.useRealTimers();
  });

  it('supports custom key function', async () => {
    const guard = rateLimit({
      action: 'block',
      maxRequests: 1,
      windowMs: 10000,
      keyFn: (_text, ctx) =>
        (ctx.metadata?.userId as string) ?? 'anon',
    });
    const ctx1 = {
      pipelineType: 'input' as const,
      metadata: { userId: 'user-a' },
    };
    const ctx2 = {
      pipelineType: 'input' as const,
      metadata: { userId: 'user-b' },
    };
    await guard.check('x', ctx1);
    const r1 = await guard.check('x', ctx1);
    const r2 = await guard.check('x', ctx2);
    expect(r1.passed).toBe(false);
    expect(r2.passed).toBe(true);
  });
});
