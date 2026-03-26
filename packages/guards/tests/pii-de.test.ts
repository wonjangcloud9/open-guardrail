import { describe, it, expect } from 'vitest';
import { piiDe } from '../src/pii-de.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-de', () => {
  it('detects German IBAN', async () => {
    expect((await piiDe({ entities: ['iban-de'], action: 'block' }).check('IBAN: DE89 3704 0044 0532 0130 00', ctx)).passed).toBe(false);
  });
  it('detects German phone', async () => {
    expect((await piiDe({ entities: ['phone-de'], action: 'block' }).check('Tel: +49 30 1234567890', ctx)).passed).toBe(false);
  });
  it('masks German PII', async () => {
    const r = await piiDe({ entities: ['phone-de'], action: 'mask' }).check('Anruf +49 30 1234567890', ctx);
    expect(r.overrideText).toContain('[Telefonnummer]');
  });
});
