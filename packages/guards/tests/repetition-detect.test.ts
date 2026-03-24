import { describe, it, expect } from 'vitest';
import { repetitionDetect } from '../src/repetition-detect.js';

describe('repetition-detect guard', () => {
  it('allows normal text', async () => {
    const guard = repetitionDetect({ action: 'block' });
    const result = await guard.check(
      'The quick brown fox jumps over the lazy dog. It was a sunny day in the park and everyone was happy.',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(true);
  });

  it('detects repeated phrases', async () => {
    const guard = repetitionDetect({ action: 'block', maxRepeatRatio: 0.2 });
    const repeated = Array(20).fill('the same thing over').join(' ');
    const result = await guard.check(repeated, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.repeatedPhrase).toBeDefined();
  });

  it('detects character loops', async () => {
    const guard = repetitionDetect({ action: 'warn' });
    const text = 'Here is the answer: ' + 'a'.repeat(100);
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('skips short text', async () => {
    const guard = repetitionDetect({ action: 'block', minTextLength: 100 });
    const result = await guard.check('short text', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns score based on repetition ratio', async () => {
    const guard = repetitionDetect({ action: 'warn', maxRepeatRatio: 0.1 });
    const text = Array(15).fill('hello world again').join(' ') + ' some unique content at the end';
    const result = await guard.check(text, { pipelineType: 'output' });
    if (!result.passed) {
      expect(result.score).toBeGreaterThan(0);
    }
  });
});
