import { describe, it, expect } from 'vitest';
import { piiCa } from '../src/pii-ca.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-ca', () => {
  it('detects Canadian postal code', async () => { expect((await piiCa({ entities: ['postal-ca'], action: 'block' }).check('Postal: K1A 0B1', ctx)).passed).toBe(false); });
  it('masks SIN', async () => { const r = await piiCa({ entities: ['sin'], action: 'mask' }).check('SIN: 123 456 789', ctx); expect(r.overrideText).toContain('[SIN]'); });
  it('allows clean text', async () => { expect((await piiCa({ entities: ['sin'], action: 'block' }).check('Hello Canada', ctx)).passed).toBe(true); });
});
