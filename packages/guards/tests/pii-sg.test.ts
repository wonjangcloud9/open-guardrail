import { describe, it, expect } from 'vitest';
import { piiSg } from '../src/pii-sg.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-sg', () => {
  it('detects NRIC', async () => { expect((await piiSg({ entities: ['nric'], action: 'block' }).check('NRIC: S1234567D', ctx)).passed).toBe(false); });
  it('masks phone', async () => { const r = await piiSg({ entities: ['phone-sg'], action: 'mask' }).check('Call 9123 4567', ctx); expect(r.overrideText).toContain('[Phone]'); });
  it('allows clean', async () => { expect((await piiSg({ entities: ['nric'], action: 'block' }).check('Hello Singapore', ctx)).passed).toBe(true); });
});
