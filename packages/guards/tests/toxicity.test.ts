import { describe, it, expect } from 'vitest';
import { toxicity } from '../src/toxicity.js';

const ctx = { pipelineType: 'input' as const };

describe('toxicity guard', () => {
  it('detects profanity', async () => {
    const guard = toxicity({ action: 'block' });
    const result = await guard.check(
      'what the fuck is this',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
    expect(result.details?.matchedCategories).toHaveProperty('profanity');
  });

  it('detects threats', async () => {
    const guard = toxicity({ action: 'warn' });
    const result = await guard.check(
      'I will kill you if you do that',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
    expect(result.details?.matchedCategories).toHaveProperty('threat');
  });

  it('allows clean text', async () => {
    const guard = toxicity({ action: 'block' });
    const result = await guard.check(
      'Hello, how are you today?',
      ctx,
    );
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
    expect(result.score).toBe(0);
  });

  it('respects threshold', async () => {
    const guard = toxicity({
      action: 'block',
      threshold: 0.99,
    });
    const result = await guard.check(
      'oh damn that is crap',
      ctx,
    );
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(0.99);
  });

  it('returns score and category details', async () => {
    const guard = toxicity({ action: 'block' });
    const result = await guard.check(
      'you are stupid and worthless, shut up',
      ctx,
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.details?.matchedCategories).toHaveProperty('harassment');
    expect(typeof result.latencyMs).toBe('number');
  });
});
