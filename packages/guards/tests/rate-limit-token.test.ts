import { describe, it, expect } from 'vitest';
import { rateLimitToken } from '../src/rate-limit-token.js';

describe('rate-limit-token guard', () => {
  it('allows text under token limit', async () => {
    const guard = rateLimitToken({ action: 'block', maxTokensPerMinute: 10000 });
    const result = await guard.check('Hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('blocks when token limit exceeded', async () => {
    const guard = rateLimitToken({ action: 'block', maxTokensPerMinute: 5, windowMs: 100 });
    const longText = 'word '.repeat(10);
    const result = await guard.check(longText, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('returns score proportional to usage', async () => {
    const guard = rateLimitToken({ action: 'warn', maxTokensPerMinute: 3, windowMs: 100 });
    const result = await guard.check('one two three four five', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
  });

  it('uses warn action when configured', async () => {
    const guard = rateLimitToken({ action: 'warn', maxTokensPerMinute: 1, windowMs: 100 });
    const result = await guard.check('one two three', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });

  it('tracks latency', async () => {
    const guard = rateLimitToken({ action: 'block' });
    const result = await guard.check('test', { pipelineType: 'input' });
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('has correct guard metadata', () => {
    const guard = rateLimitToken({ action: 'block' });
    expect(guard.name).toBe('rate-limit-token');
    expect(guard.category).toBe('security');
  });
});
