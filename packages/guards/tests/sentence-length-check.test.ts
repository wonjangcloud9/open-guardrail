import { describe, it, expect } from 'vitest';
import { sentenceLengthCheck } from '../src/sentence-length-check.js';

const ctx = { pipelineType: 'output' as const };

describe('sentence-length-check guard', () => {
  it('passes normal sentences', async () => {
    const guard = sentenceLengthCheck({ action: 'warn' });
    const result = await guard.check('This is a normal sentence. It has reasonable length.', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects extremely long sentences', async () => {
    const guard = sentenceLengthCheck({ action: 'block', maxWords: 10 });
    const long = 'This is a very long sentence that has way too many words in it for comfort.';
    const result = await guard.check(long, ctx);
    expect(result.passed).toBe(false);
  });

  it('detects very short sentences', async () => {
    const guard = sentenceLengthCheck({ action: 'warn' });
    const result = await guard.check('It is. Ok. This is fine though.', ctx);
    expect(result.passed).toBe(false);
  });

  it('passes empty text', async () => {
    const guard = sentenceLengthCheck({ action: 'block' });
    const result = await guard.check('', ctx);
    expect(result.passed).toBe(true);
  });

  it('respects custom maxWords', async () => {
    const guard = sentenceLengthCheck({ action: 'warn', maxWords: 5 });
    const result = await guard.check('This sentence has exactly six words here.', ctx);
    expect(result.passed).toBe(false);
  });

  it('returns issues in details', async () => {
    const guard = sentenceLengthCheck({ action: 'warn', maxWords: 5 });
    const result = await guard.check('This is way too many words in one sentence here.', ctx);
    expect(result.details?.issues).toBeDefined();
  });
});
