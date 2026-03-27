import { describe, it, expect } from 'vitest';
import { rateAdaptive } from '../src/rate-adaptive.js';

describe('rate-adaptive', () => {
  it('passes within limits', async () => {
    const guard = rateAdaptive({
      action: 'block',
      softLimit: 5,
      hardLimit: 10,
      windowMs: 60000,
    });
    const ctx = { pipelineType: 'input' as const };
    const r = await guard.check('hello', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('blocks after hard limit exceeded', async () => {
    const guard = rateAdaptive({
      action: 'block',
      softLimit: 2,
      hardLimit: 3,
      windowMs: 60000,
    });
    const ctx = { pipelineType: 'input' as const };
    await guard.check('a', ctx);
    await guard.check('b', ctx);
    await guard.check('c', ctx);
    const r = await guard.check('d', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });
});
