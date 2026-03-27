import { describe, it, expect } from 'vitest';
import { chainOfThoughtLeak } from '../src/chain-of-thought-leak.js';

describe('chain-of-thought-leak guard', () => {
  it('passes clean output', async () => {
    const guard = chainOfThoughtLeak({ action: 'block' });
    const r = await guard.check('Paris is the capital of France.', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('detects thinking tags', async () => {
    const guard = chainOfThoughtLeak({ action: 'block' });
    const r = await guard.check('<thinking>Let me analyze this</thinking> The answer is 42.', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('detects scratchpad markers', async () => {
    const guard = chainOfThoughtLeak({ action: 'warn' });
    const r = await guard.check('[SCRATCHPAD] Internal reasoning here', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
