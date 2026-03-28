import { describe, it, expect } from 'vitest';
import { biasAge } from '../src/bias-age.js';
const ctx = { pipelineType: 'output' as const };
describe('bias-age', () => {
  it('detects too old to', async () => {
    const g = biasAge({ action: 'block' });
    expect((await g.check('You are too old to learn programming.', ctx)).passed).toBe(false);
  });
  it('detects ok boomer', async () => {
    const g = biasAge({ action: 'warn' });
    const r = await g.check('Ok boomer, you wouldn\'t understand.', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('detects senior moment', async () => {
    const g = biasAge({ action: 'block' });
    expect((await g.check('Must be having a senior moment.', ctx)).passed).toBe(false);
  });
  it('detects digital native', async () => {
    const g = biasAge({ action: 'warn' });
    expect((await g.check('Only digital native employees can handle this.', ctx)).passed).toBe(false);
  });
  it('detects millennials stereotype', async () => {
    const g = biasAge({ action: 'block' });
    expect((await g.check('Millennials are lazy workers.', ctx)).passed).toBe(false);
  });
  it('allows age-neutral text', async () => {
    const g = biasAge({ action: 'block' });
    expect((await g.check('All employees are valued regardless of experience level.', ctx)).passed).toBe(true);
  });
  it('detects discriminatory hiring language', async () => {
    const g = biasAge({ action: 'block' });
    expect((await g.check('Age 40 or older need not apply.', ctx)).passed).toBe(false);
  });
});
