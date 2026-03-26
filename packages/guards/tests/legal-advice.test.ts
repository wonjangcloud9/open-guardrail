import { describe, it, expect } from 'vitest';
import { legalAdvice } from '../src/legal-advice.js';
const ctx = { pipelineType: 'output' as const };
describe('legal-advice', () => {
  it('detects lawsuit suggestion', async () => {
    const g = legalAdvice({ action: 'block' });
    expect((await g.check('You should sue them for damages', ctx)).passed).toBe(false);
  });
  it('detects legal obligation claim', async () => {
    const g = legalAdvice({ action: 'warn' });
    expect((await g.check('Legally you are required to pay', ctx)).passed).toBe(false);
  });
  it('allows general legal info', async () => {
    const g = legalAdvice({ action: 'block' });
    expect((await g.check('Laws vary by jurisdiction.', ctx)).passed).toBe(true);
  });
});
