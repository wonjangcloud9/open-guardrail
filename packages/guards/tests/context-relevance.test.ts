import { describe, it, expect } from 'vitest';
import { contextRelevance } from '../src/context-relevance.js';

describe('context-relevance guard', () => {
  it('passes relevant response', async () => {
    const guard = contextRelevance({ action: 'warn', query: 'What is machine learning?', minRelevance: 0.1 });
    const r = await guard.check('Machine learning is a subset of artificial intelligence that enables systems to learn from data.', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('blocks irrelevant response', async () => {
    const guard = contextRelevance({ action: 'block', query: 'What is machine learning?', minRelevance: 0.2 });
    const r = await guard.check('Today I went shopping and bought some groceries at the supermarket.', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('has score', async () => {
    const guard = contextRelevance({ action: 'warn', query: 'test' });
    const r = await guard.check('test response', { pipelineType: 'output' });
    expect(r.score).toBeDefined();
  });
});
