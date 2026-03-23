import { describe, it, expect } from 'vitest';
import { wordCount } from '../src/word-count.js';

describe('word-count guard', () => {
  it('blocks text exceeding max words', async () => {
    const guard = wordCount({ max: 5, action: 'block' });
    const result = await guard.check('one two three four five six seven', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.wordCount).toBe(7);
  });

  it('blocks text below min words', async () => {
    const guard = wordCount({ min: 3, action: 'block' });
    const result = await guard.check('hi', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows text within range', async () => {
    const guard = wordCount({ min: 1, max: 10, action: 'block' });
    const result = await guard.check('hello world', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('counts by characters when unit=chars', async () => {
    const guard = wordCount({ max: 10, unit: 'chars', action: 'warn' });
    const result = await guard.check('hello world!', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.charCount).toBe(12);
  });
});
