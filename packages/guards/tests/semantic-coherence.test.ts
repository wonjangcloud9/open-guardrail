import { describe, it, expect } from 'vitest';
import { semanticCoherence } from '../src/semantic-coherence.js';

describe('semantic-coherence guard', () => {
  it('detects contradictory sentences', async () => {
    const guard = semanticCoherence({ action: 'warn' });
    const result = await guard.check('The value is true. The value is false.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects always/never contradiction', async () => {
    const guard = semanticCoherence({ action: 'warn' });
    const result = await guard.check('This always works. This never works.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes coherent text', async () => {
    const guard = semanticCoherence({ action: 'warn' });
    const result = await guard.check('Paris is the capital of France. It is known for the Eiffel Tower and rich culture.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects word salad', async () => {
    const guard = semanticCoherence({ action: 'warn' });
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
    const result = await guard.check(words, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes short coherent text', async () => {
    const guard = semanticCoherence({ action: 'warn' });
    const result = await guard.check('Yes, that is correct.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns score between 0 and 1', async () => {
    const guard = semanticCoherence({ action: 'warn' });
    const result = await guard.check('It is true. It is false.', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
