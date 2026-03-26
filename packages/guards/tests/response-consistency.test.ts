import { describe, it, expect } from 'vitest';
import { responseConsistency } from '../src/response-consistency.js';
const ctx = { pipelineType: 'output' as const };
describe('response-consistency', () => {
  it('detects contradictions', async () => {
    const text = 'The answer is always true. However, the answer is never true in practice.';
    expect((await responseConsistency({ action: 'warn' }).check(text, ctx)).passed).toBe(false);
  });
  it('allows consistent text', async () => { expect((await responseConsistency({ action: 'block' }).check('Python is a programming language. It is widely used.', ctx)).passed).toBe(true); });
});
