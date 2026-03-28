import { describe, it, expect } from 'vitest';
import { outputConsistency } from '../src/output-consistency.js';
const ctx = { pipelineType: 'output' as const };
describe('output-consistency', () => {
  it('detects contradictions', async () => {
    const g = outputConsistency({ action: 'warn' });
    const r = await g.check('The answer is correct. The answer is not correct.', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('contradiction');
  });
  it('detects excessive repetition', async () => {
    const g = outputConsistency({ action: 'block', maxRepetitions: 2 });
    const text = 'This is great. This is great. This is great. This is great.';
    expect((await g.check(text, ctx)).passed).toBe(false);
  });
  it('detects list count mismatch', async () => {
    const g = outputConsistency({ action: 'warn' });
    const text = 'Here are 5 items:\n1) First\n2) Second\n3) Third';
    const r = await g.check(text, ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('list-count-mismatch');
  });
  it('passes consistent output', async () => {
    const g = outputConsistency({ action: 'block' });
    expect((await g.check('The weather is nice today. I recommend going outside.', ctx)).passed).toBe(true);
  });
  it('respects maxRepetitions option', async () => {
    const g = outputConsistency({ action: 'block', maxRepetitions: 5 });
    const text = 'This is great. This is great. This is great. This is great.';
    expect((await g.check(text, ctx)).passed).toBe(true);
  });
});
