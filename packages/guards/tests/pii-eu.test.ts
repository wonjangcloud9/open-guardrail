import { describe, it, expect } from 'vitest';
import { piiEu } from '../src/pii-eu.js';

const ctx = { pipelineType: 'input' as const };

describe('pii-eu guard', () => {
  it('detects IBAN', async () => {
    const guard = piiEu({ entities: ['iban'], action: 'block' });
    const result = await guard.check('IBAN: DE89370400440532013000', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects German VAT', async () => {
    const guard = piiEu({ entities: ['vat'], action: 'block' });
    const result = await guard.check('VAT: DE123456789', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects UK NINO', async () => {
    const guard = piiEu({ entities: ['nino-uk'], action: 'block' });
    const result = await guard.check('NINO: AB123456C', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects Spanish NIF', async () => {
    const guard = piiEu({ entities: ['nif-es'], action: 'block' });
    const result = await guard.check('NIF: 12345678Z', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks IBAN', async () => {
    const guard = piiEu({ entities: ['iban'], action: 'mask' });
    const result = await guard.check('Account: DE89370400440532013000', ctx);
    expect(result.overrideText).toContain('[IBAN]');
  });

  it('allows clean text', async () => {
    const guard = piiEu({ entities: ['iban', 'vat'], action: 'block' });
    const result = await guard.check('Bonjour, comment allez-vous?', ctx);
    expect(result.passed).toBe(true);
  });
});
