import { describe, it, expect } from 'vitest';
import { piiIn } from '../src/pii-in.js';

const ctx = { pipelineType: 'input' as const };

describe('pii-in guard', () => {
  it('detects Aadhaar number', async () => {
    const guard = piiIn({ entities: ['aadhaar'], action: 'block' });
    const result = await guard.check('Aadhaar: 2345 6789 0123', ctx);
    expect(result.passed).toBe(false);
  });

  it('rejects invalid Aadhaar starting with 0 or 1', async () => {
    const guard = piiIn({ entities: ['aadhaar'], action: 'block' });
    const result = await guard.check('Number: 0123 4567 8901', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects PAN number', async () => {
    const guard = piiIn({ entities: ['pan'], action: 'block' });
    const result = await guard.check('PAN: ABCDE1234F', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects Indian phone number', async () => {
    const guard = piiIn({ entities: ['phone'], action: 'block' });
    const result = await guard.check('Call +91 9876543210', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects IFSC code', async () => {
    const guard = piiIn({ entities: ['ifsc'], action: 'block' });
    const result = await guard.check('IFSC: SBIN0001234', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks Aadhaar', async () => {
    const guard = piiIn({ entities: ['aadhaar'], action: 'mask' });
    const result = await guard.check('Aadhaar: 2345 6789 0123', ctx);
    expect(result.overrideText).toContain('[आधार नंबर]');
  });

  it('allows clean text', async () => {
    const guard = piiIn({ entities: ['aadhaar', 'pan', 'phone'], action: 'block' });
    const result = await guard.check('नमस्ते, आज मौसम अच्छा है', ctx);
    expect(result.passed).toBe(true);
  });
});
