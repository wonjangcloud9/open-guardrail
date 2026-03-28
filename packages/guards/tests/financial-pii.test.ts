import { describe, it, expect } from 'vitest';
import { financialPii } from '../src/financial-pii.js';
const ctx = { pipelineType: 'input' as const };
describe('financial-pii', () => {
  it('detects IBAN', async () => {
    const g = financialPii({ action: 'block' });
    const r = await g.check('Transfer to DE89 3704 0044 0532 0130 00', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.types).toContain('IBAN');
  });
  it('detects EIN', async () => {
    const g = financialPii({ action: 'block' });
    expect((await g.check('Company EIN is 12-3456789', ctx)).passed).toBe(false);
  });
  it('detects SWIFT/BIC codes', async () => {
    const g = financialPii({ action: 'block' });
    expect((await g.check('SWIFT code DEUTDEFF', ctx)).passed).toBe(false);
  });
  it('detects wire transfer references', async () => {
    const g = financialPii({ action: 'block' });
    expect((await g.check('Wire ref: TXN2024ABC123', ctx)).passed).toBe(false);
  });
  it('allows clean text', async () => {
    const g = financialPii({ action: 'block' });
    expect((await g.check('Please review the quarterly report', ctx)).passed).toBe(true);
  });
  it('masks financial data by default', async () => {
    const g = financialPii({ action: 'warn' });
    const r = await g.check('Account #123456789012', ctx);
    expect(r.details?.maskedText).toContain('[REDACTED]');
  });
});
