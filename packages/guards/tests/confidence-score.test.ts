import { describe, it, expect } from 'vitest';
import { confidenceScore } from '../src/confidence-score.js';

describe('confidence-score guard', () => {
  it('detects excessive hedging', async () => {
    const guard = confidenceScore({ action: 'warn' });
    const text = 'I think maybe this is probably right, but I believe it might be wrong. Not sure though, roughly speaking.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details).toHaveProperty('hedging_count');
  });

  it('detects overconfidence', async () => {
    const guard = confidenceScore({ action: 'warn' });
    const text = 'This is definitely correct. I am 100% certain. Absolutely guaranteed without a doubt.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect((result.details as Record<string, number>).overconfidence_count).toBeGreaterThan(2);
  });

  it('allows balanced output', async () => {
    const guard = confidenceScore({ action: 'block' });
    const text = 'The answer is 42. This is based on the provided data.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('allows moderate hedging within limit', async () => {
    const guard = confidenceScore({ action: 'block' });
    const text = 'I think this is correct. Maybe it could be improved.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('respects custom maxHedging threshold', async () => {
    const guard = confidenceScore({ action: 'block', maxHedging: 1 });
    const text = 'I think maybe this is probably right.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('always includes details with counts', async () => {
    const guard = confidenceScore({ action: 'block' });
    const result = await guard.check('Simple factual statement.', { pipelineType: 'output' });
    expect(result.details).toHaveProperty('hedging_count');
    expect(result.details).toHaveProperty('overconfidence_count');
  });
});
