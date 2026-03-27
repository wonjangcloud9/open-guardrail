import { describe, it, expect } from 'vitest';
import { multiTurnCoherence } from '../src/multi-turn-coherence.js';

describe('multi-turn-coherence', () => {
  it('passes similar messages', async () => {
    const guard = multiTurnCoherence({
      action: 'block',
      maxDrift: 0.1,
    });
    const ctx = { pipelineType: 'output' as const };
    await guard.check(
      'Machine learning models use neural networks for training',
      ctx,
    );
    const r = await guard.check(
      'Neural networks and machine learning training processes',
      ctx,
    );
    expect(r.passed).toBe(true);
  });

  it('blocks wildly different messages', async () => {
    const guard = multiTurnCoherence({
      action: 'block',
      maxDrift: 0.1,
    });
    const ctx = { pipelineType: 'output' as const };
    await guard.check(
      'Quantum physics explores subatomic particles',
      ctx,
    );
    const r = await guard.check(
      'Chocolate cake recipe with frosting instructions',
      ctx,
    );
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });
});
