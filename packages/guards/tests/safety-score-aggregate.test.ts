import { describe, it, expect } from 'vitest';
import { safetyScoreAggregate } from '../src/safety-score-aggregate.js';

describe('safety-score-aggregate', () => {
  const guard = safetyScoreAggregate({
    action: 'block',
    threshold: 0.3,
  });
  const ctx = { pipelineType: 'input' as const };

  it('passes clean text', async () => {
    const r = await guard.check(
      'The weather is nice today',
      ctx,
    );
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('blocks multi-category match', async () => {
    const r = await guard.check(
      'kill murder attack assault weapon hate racist bigot suicide self-harm explicit pornograph',
      ctx,
    );
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });
});
