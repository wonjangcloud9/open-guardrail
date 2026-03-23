import { describe, it, expect } from 'vitest';
import { costGuard } from '../src/cost-guard.js';

describe('cost-guard', () => {
  it('blocks when exceeding max tokens', async () => {
    const guard = costGuard({ action: 'block', maxTokens: 10 });
    const text = 'a'.repeat(100); // ~25 tokens
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('warns on cost limit exceeded', async () => {
    const guard = costGuard({
      action: 'warn',
      maxCostUsd: 0.0001,
      costPerToken: 0.001,
    });
    const text = 'a'.repeat(100); // 25 tokens * 0.001 = 0.025
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('allows text within limits', async () => {
    const guard = costGuard({
      action: 'block',
      maxTokens: 1000,
      maxCostUsd: 1.0,
    });
    const result = await guard.check('hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('uses custom token estimator', async () => {
    const guard = costGuard({
      action: 'block',
      maxTokens: 5,
      estimateTokens: (text) => text.split(' ').length,
    });
    const result = await guard.check('one two three', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.details?.tokens).toBe(3);
  });
});
