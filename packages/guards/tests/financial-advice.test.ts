import { describe, it, expect } from 'vitest';
import { financialAdvice } from '../src/financial-advice.js';
const ctx = { pipelineType: 'output' as const };
describe('financial-advice', () => {
  it('detects investment recommendation', async () => {
    const g = financialAdvice({ action: 'block' });
    expect((await g.check('You should buy this stock now', ctx)).passed).toBe(false);
  });
  it('detects guaranteed returns claim', async () => {
    const g = financialAdvice({ action: 'warn' });
    expect((await g.check('This is guaranteed to profit', ctx)).passed).toBe(false);
  });
  it('allows general finance info', async () => {
    const g = financialAdvice({ action: 'block' });
    expect((await g.check('Diversification is a common investment strategy.', ctx)).passed).toBe(true);
  });
});
