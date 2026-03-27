import { describe, it, expect } from 'vitest';
import { rateLimitPerUser } from '../src/rate-limit-per-user.js';

describe('rate-limit-per-user guard', () => {
  it('passes within limit', async () => {
    const guard = rateLimitPerUser({ action: 'block', maxRequests: 5 });
    const r = await guard.check('query', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });

  it('blocks after exceeding limit', async () => {
    const guard = rateLimitPerUser({ action: 'block', maxRequests: 2 });
    await guard.check('q1', { pipelineType: 'input' });
    await guard.check('q2', { pipelineType: 'input' });
    const r = await guard.check('q3', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });
});
