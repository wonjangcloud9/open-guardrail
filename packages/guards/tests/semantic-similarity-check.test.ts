import { describe, it, expect } from 'vitest';
import { semanticSimilarityCheck } from '../src/semantic-similarity-check.js';
describe('semantic-similarity-check', () => {
  it('flags output that is identical to input', async () => {
    const g = semanticSimilarityCheck({ action: 'block' });
    const text = 'This is a test sentence for checking similarity';
    const r = await g.check(text, { pipelineType: 'output', inputText: text } as never);
    expect(r.passed).toBe(false);
  });
  it('flags output very similar to input', async () => {
    const g = semanticSimilarityCheck({ action: 'block', threshold: 0.7 });
    const input = 'The quick brown fox jumps over the lazy dog';
    const output = 'The quick brown fox jumped over the lazy dog';
    const r = await g.check(output, { pipelineType: 'output', inputText: input } as never);
    expect(r.passed).toBe(false);
  });
  it('passes when output is different from input', async () => {
    const g = semanticSimilarityCheck({ action: 'block' });
    const r = await g.check('Something completely different here', { pipelineType: 'output', inputText: 'What is the weather today?' } as never);
    expect(r.passed).toBe(true);
  });
  it('passes when no input provided in context', async () => {
    const g = semanticSimilarityCheck({ action: 'block' });
    const r = await g.check('Some output', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
  it('returns similarity score in details', async () => {
    const g = semanticSimilarityCheck({ action: 'block' });
    const r = await g.check('Hello world', { pipelineType: 'output', inputText: 'Hello world' } as never);
    expect(r.details?.similarity).toBeGreaterThan(0);
  });
  it('has correct metadata', async () => {
    const g = semanticSimilarityCheck({ action: 'block' });
    expect(g.name).toBe('semantic-similarity-check');
    expect(g.category).toBe('ai');
  });
});
