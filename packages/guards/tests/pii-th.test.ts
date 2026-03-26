import { describe, it, expect } from 'vitest';
import { piiTh } from '../src/pii-th.js';

const ctx = { pipelineType: 'input' as const };

describe('pii-th guard', () => {
  it('detects Thai phone number', async () => {
    const guard = piiTh({ entities: ['phone'], action: 'block' });
    const result = await guard.check('โทร 081-234-5678', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects passport number', async () => {
    const guard = piiTh({ entities: ['passport'], action: 'block' });
    const result = await guard.check('หนังสือเดินทาง AA1234567', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks phone number', async () => {
    const guard = piiTh({ entities: ['phone'], action: 'mask' });
    const result = await guard.check('โทร 081-234-5678', ctx);
    expect(result.overrideText).toContain('[เบอร์โทรศัพท์]');
  });

  it('allows clean text', async () => {
    const guard = piiTh({ entities: ['national-id', 'phone'], action: 'block' });
    const result = await guard.check('สวัสดีครับ วันนี้อากาศดี', ctx);
    expect(result.passed).toBe(true);
  });
});
