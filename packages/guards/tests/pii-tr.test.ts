import { describe, it, expect } from 'vitest';
import { piiTr } from '../src/pii-tr.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-tr', () => {
  it('detects Turkish phone', async () => { expect((await piiTr({ entities: ['phone-tr'], action: 'block' }).check('Tel: +90 532 123 45 67', ctx)).passed).toBe(false); });
  it('masks TC Kimlik', async () => { const r = await piiTr({ entities: ['tc-kimlik'], action: 'mask' }).check('TC: 12345678901', ctx); expect(r.overrideText).toContain('[TC Kimlik]'); });
  it('allows clean', async () => { expect((await piiTr({ entities: ['phone-tr'], action: 'block' }).check('Merhaba dunya', ctx)).passed).toBe(true); });
});
