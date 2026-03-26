import { describe, it, expect } from 'vitest';
import { citationCheck } from '../src/citation-check.js';
const ctx = { pipelineType: 'output' as const };

describe('citation-check guard', () => {
  it('detects unsourced claims', async () => {
    const guard = citationCheck({ action: 'warn', maxUnsourced: 0 });
    const result = await guard.check('Studies show that 90% of users prefer this.', ctx);
    expect(result.passed).toBe(false);
  });
  it('allows cited content', async () => {
    const guard = citationCheck({ action: 'block', maxUnsourced: 1 });
    const result = await guard.check('According to Smith (2024), this is effective [1].', ctx);
    expect(result.passed).toBe(true);
  });
  it('requires citation when configured', async () => {
    const guard = citationCheck({ action: 'block', requireCitation: true });
    const result = await guard.check('Research indicates this is true. Experts say so.', ctx);
    expect(result.passed).toBe(false);
  });
});
