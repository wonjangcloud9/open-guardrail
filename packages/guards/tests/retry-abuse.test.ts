import { describe, it, expect } from 'vitest';
import { retryAbuse } from '../src/retry-abuse.js';

describe('retry-abuse guard', () => {
  it('allows first request', async () => {
    const guard = retryAbuse({ action: 'block' });
    const result = await guard.check('unique request text 1', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects exceeding max retries', async () => {
    const guard = retryAbuse({ action: 'block', maxRetries: 2, windowMs: 60000 });
    const text = 'same request repeated';
    await guard.check(text, { pipelineType: 'input' });
    await guard.check(text, { pipelineType: 'input' });
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('allows different requests', async () => {
    const guard = retryAbuse({ action: 'block', maxRetries: 1, windowMs: 60000 });
    const r1 = await guard.check('request A', { pipelineType: 'input' });
    const r2 = await guard.check('request B', { pipelineType: 'input' });
    expect(r1.passed).toBe(true);
    expect(r2.passed).toBe(true);
  });

  it('uses warn action when configured', async () => {
    const guard = retryAbuse({ action: 'warn', maxRetries: 1, windowMs: 60000 });
    const text = 'warn test';
    await guard.check(text, { pipelineType: 'input' });
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });

  it('returns retry count in details', async () => {
    const guard = retryAbuse({ action: 'block', maxRetries: 1, windowMs: 60000 });
    const text = 'count test';
    await guard.check(text, { pipelineType: 'input' });
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect((result.details as any).retryCount).toBeGreaterThanOrEqual(2);
  });

  it('returns score proportional to issues', async () => {
    const guard = retryAbuse({ action: 'block', maxRetries: 1, windowMs: 60000 });
    const text = 'score test';
    await guard.check(text, { pipelineType: 'input' });
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
