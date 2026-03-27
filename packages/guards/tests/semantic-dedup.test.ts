import { describe, it, expect } from 'vitest';
import { semanticDedup } from '../src/semantic-dedup.js';

const ctx = { pipelineType: 'output' as const };

describe('semantic-dedup guard', () => {
  it('flags near-duplicate responses', async () => {
    const guard = semanticDedup({ action: 'warn', threshold: 0.8 });
    await guard.check('The quick brown fox jumps over the lazy dog.', ctx);
    const result = await guard.check('The quick brown fox jumps over the lazy dog.', ctx);
    expect(result.passed).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it('allows distinct responses', async () => {
    const guard = semanticDedup({ action: 'block', threshold: 0.9 });
    await guard.check('Apples are a nutritious fruit.', ctx);
    const result = await guard.check('Quantum physics is fascinating.', ctx);
    expect(result.passed).toBe(true);
  });
});
