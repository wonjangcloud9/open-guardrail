import { describe, it, expect } from 'vitest';
import { answerCompleteness } from '../src/answer-completeness.js';
const ctx = { pipelineType: 'output' as const };

describe('answer-completeness guard', () => {
  it('blocks truncated response', async () => {
    const guard = answerCompleteness({ action: 'block' });
    const result = await guard.check('There are many reasons...', ctx);
    expect(result.passed).toBe(false);
  });
  it('blocks too-short response', async () => {
    const guard = answerCompleteness({ action: 'block', minSentences: 3 });
    const result = await guard.check('Yes. No.', ctx);
    expect(result.passed).toBe(false);
  });
  it('allows complete response', async () => {
    const guard = answerCompleteness({ action: 'block' });
    const result = await guard.check('Python is a programming language. It was created in 1991. It is widely used today.', ctx);
    expect(result.passed).toBe(true);
  });
});
