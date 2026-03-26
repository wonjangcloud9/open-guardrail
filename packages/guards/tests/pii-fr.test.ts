import { describe, it, expect } from 'vitest';
import { piiFr } from '../src/pii-fr.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-fr', () => {
  it('detects French phone', async () => {
    expect((await piiFr({ entities: ['phone-fr'], action: 'block' }).check('Tel: 06 12 34 56 78', ctx)).passed).toBe(false);
  });
  it('masks French PII', async () => {
    const r = await piiFr({ entities: ['phone-fr'], action: 'mask' }).check('Appel 06 12 34 56 78', ctx);
    expect(r.overrideText).toContain('[Telephone]');
  });
  it('allows clean text', async () => {
    expect((await piiFr({ entities: ['phone-fr', 'nir'], action: 'block' }).check('Bonjour le monde', ctx)).passed).toBe(true);
  });
});
