import { describe, it, expect } from 'vitest';
import { piiMx } from '../src/pii-mx.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-mx', () => {
  it('detects CURP', async () => { expect((await piiMx({ entities: ['curp'], action: 'block' }).check('CURP: GARC850101HDFRRL09', ctx)).passed).toBe(false); });
  it('masks RFC', async () => { const r = await piiMx({ entities: ['rfc'], action: 'mask' }).check('RFC: GARC850101ABC', ctx); expect(r.overrideText).toContain('[RFC]'); });
  it('allows clean text', async () => { expect((await piiMx({ entities: ['curp'], action: 'block' }).check('Hola mundo', ctx)).passed).toBe(true); });
});
