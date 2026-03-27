import { describe, it, expect } from 'vitest';
import { semanticSimilarity } from '../src/semantic-similarity.js';

describe('semantic-similarity guard', () => {
  it('blocks similar text in deny mode', async () => {
    const guard = semanticSimilarity({
      action: 'block',
      references: ['the quick brown fox jumps over the lazy dog'],
      threshold: 0.5,
      mode: 'deny',
    });
    const r = await guard.check('the quick brown fox leaps over the lazy dog', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('passes dissimilar text in deny mode', async () => {
    const guard = semanticSimilarity({
      action: 'block',
      references: ['the quick brown fox jumps over the lazy dog'],
      threshold: 0.5,
      mode: 'deny',
    });
    const r = await guard.check('quantum computing uses qubits for parallel processing', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('blocks dissimilar text in require mode', async () => {
    const guard = semanticSimilarity({
      action: 'warn',
      references: ['customer support greeting hello'],
      threshold: 0.3,
      mode: 'require',
    });
    const r = await guard.check('quantum physics black holes', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('has latencyMs and score', async () => {
    const guard = semanticSimilarity({ action: 'block', references: ['test'], threshold: 0.9 });
    const r = await guard.check('test', { pipelineType: 'output' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeDefined();
  });
});
