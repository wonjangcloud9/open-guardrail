import { describe, it, expect } from 'vitest';
import { medicalPii } from '../src/medical-pii.js';
const ctx = { pipelineType: 'input' as const };
describe('medical-pii', () => {
  it('detects ICD-10 codes', async () => {
    const g = medicalPii({ action: 'block' });
    const r = await g.check('Diagnosis: E11.65 diabetes', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.types).toContain('ICD-10 code');
  });
  it('detects prescription numbers', async () => {
    const g = medicalPii({ action: 'block' });
    expect((await g.check('Rx# 12345678 refill', ctx)).passed).toBe(false);
  });
  it('detects MRN', async () => {
    const g = medicalPii({ action: 'block' });
    expect((await g.check('MRN: 1234567890', ctx)).passed).toBe(false);
  });
  it('detects blood type results', async () => {
    const g = medicalPii({ action: 'block' });
    expect((await g.check('Blood type: AB+', ctx)).passed).toBe(false);
  });
  it('allows clean text', async () => {
    const g = medicalPii({ action: 'block' });
    expect((await g.check('The patient feels better today', ctx)).passed).toBe(true);
  });
  it('masks medical data when enabled', async () => {
    const g = medicalPii({ action: 'warn', maskMedical: true });
    const r = await g.check('MRN: 1234567890', ctx);
    expect(r.details?.maskedText).toContain('[REDACTED]');
  });
  it('skips masking when disabled', async () => {
    const g = medicalPii({ action: 'warn', maskMedical: false });
    const r = await g.check('MRN: 1234567890', ctx);
    expect(r.details?.maskedText).toBeUndefined();
  });
});
