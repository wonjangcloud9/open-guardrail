import { describe, it, expect } from 'vitest';
import { confidenceCheck } from '../src/confidence-check.js';
const ctx = { pipelineType: 'output' as const };
describe('confidence-check', () => {
  it('blocks hedging in block-hedging mode', async () => {
    const g = confidenceCheck({ action: 'warn', mode: 'block-hedging' });
    expect((await g.check('I think maybe it could be true', ctx)).passed).toBe(false);
  });
  it('allows confident text in block-hedging mode', async () => {
    const g = confidenceCheck({ action: 'block', mode: 'block-hedging' });
    expect((await g.check('The answer is 42. This is correct.', ctx)).passed).toBe(true);
  });
  it('requires hedging in require-hedging mode', async () => {
    const g = confidenceCheck({ action: 'warn', mode: 'require-hedging' });
    expect((await g.check('The answer is definitely 42.', ctx)).passed).toBe(false);
  });
});
