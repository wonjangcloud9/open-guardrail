import { describe, it, expect } from 'vitest';
import { contentLength } from '../src/content-length.js';

const ctx = { pipelineType: 'output' as const };

describe('content-length guard', () => {
  it('blocks text below min chars', async () => {
    const guard = contentLength({ action: 'block', minLength: 20 });
    const result = await guard.check('Short', ctx);
    expect(result.passed).toBe(false);
  });

  it('blocks text above max chars', async () => {
    const guard = contentLength({ action: 'block', maxLength: 10 });
    const result = await guard.check('This is a longer text that exceeds limit', ctx);
    expect(result.passed).toBe(false);
  });

  it('counts words', async () => {
    const guard = contentLength({ action: 'block', maxLength: 3, unit: 'words' });
    const result = await guard.check('one two three four', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.measured).toBe(4);
  });

  it('counts sentences', async () => {
    const guard = contentLength({ action: 'warn', maxLength: 1, unit: 'sentences' });
    const result = await guard.check('First sentence. Second sentence.', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.measured).toBe(2);
  });

  it('allows text within range', async () => {
    const guard = contentLength({ action: 'block', minLength: 1, maxLength: 100 });
    const result = await guard.check('Perfect length', ctx);
    expect(result.passed).toBe(true);
  });
});
