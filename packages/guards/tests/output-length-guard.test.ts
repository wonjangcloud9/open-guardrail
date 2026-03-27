import { describe, it, expect } from 'vitest';
import { outputLengthGuard } from '../src/output-length-guard.js';

const ctx = { pipelineType: 'output' as const };

describe('output-length-guard', () => {
  it('blocks output exceeding max words', async () => {
    const guard = outputLengthGuard({ action: 'block', maxWords: 3 });
    const result = await guard.check('one two three four five', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.wordCount).toBe(5);
  });

  it('allows output within range', async () => {
    const guard = outputLengthGuard({ action: 'warn', minWords: 2, maxWords: 10 });
    const result = await guard.check('hello world today', ctx);
    expect(result.passed).toBe(true);
  });
});
