import { describe, it, expect } from 'vitest';
import { rateLimitSemantic } from '../src/rate-limit-semantic.js';

describe('rate-limit-semantic guard', () => {
  it('allows first request', async () => {
    const guard = rateLimitSemantic({ action: 'block', maxSimilarRequests: 3 });
    const result = await guard.check('What is the weather today?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('blocks after too many similar requests', async () => {
    const guard = rateLimitSemantic({ action: 'block', maxSimilarRequests: 3, similarityThreshold: 0.7 });
    await guard.check('What is the weather today?', { pipelineType: 'input' });
    await guard.check('What is the weather today', { pipelineType: 'input' });
    await guard.check('What is the weather today!', { pipelineType: 'input' });
    const result = await guard.check('What is the weather today?', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('allows dissimilar requests', async () => {
    const guard = rateLimitSemantic({ action: 'block', maxSimilarRequests: 2 });
    await guard.check('Tell me about cats', { pipelineType: 'input' });
    await guard.check('How does photosynthesis work?', { pipelineType: 'input' });
    const result = await guard.check('What is quantum computing?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('provides details when triggered', async () => {
    const guard = rateLimitSemantic({ action: 'warn', maxSimilarRequests: 2 });
    await guard.check('Hello world', { pipelineType: 'input' });
    await guard.check('Hello world!', { pipelineType: 'input' });
    const result = await guard.check('Hello world.', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.details?.similarCount).toBeGreaterThanOrEqual(2);
  });

  it('returns score when triggered', async () => {
    const guard = rateLimitSemantic({ action: 'block', maxSimilarRequests: 2 });
    await guard.check('Repeat this', { pipelineType: 'input' });
    await guard.check('Repeat this!', { pipelineType: 'input' });
    const result = await guard.check('Repeat this.', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('reports latency', async () => {
    const guard = rateLimitSemantic({ action: 'block' });
    const result = await guard.check('Test message', { pipelineType: 'input' });
    expect(typeof result.latencyMs).toBe('number');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
