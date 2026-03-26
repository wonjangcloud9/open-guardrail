import { describe, it, expect } from 'vitest';
import { piiAr } from '../src/pii-ar.js';

const ctx = { pipelineType: 'input' as const };

describe('pii-ar guard', () => {
  it('detects Saudi phone number', async () => {
    const guard = piiAr({ entities: ['phone'], action: 'block' });
    const result = await guard.check('اتصل على +966-50-123-4567', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects IBAN', async () => {
    const guard = piiAr({ entities: ['iban'], action: 'block' });
    const result = await guard.check('حساب SA0380000000608010167519', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects passport', async () => {
    const guard = piiAr({ entities: ['passport'], action: 'block' });
    const result = await guard.check('جواز سفر A12345678', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks phone', async () => {
    const guard = piiAr({ entities: ['phone'], action: 'mask' });
    const result = await guard.check('+966-50-123-4567', ctx);
    expect(result.overrideText).toContain('[رقم الهاتف]');
  });

  it('allows clean text', async () => {
    const guard = piiAr({ entities: ['phone', 'iban'], action: 'block' });
    const result = await guard.check('مرحبا كيف حالك', ctx);
    expect(result.passed).toBe(true);
  });
});
