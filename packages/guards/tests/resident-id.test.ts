import { describe, it, expect } from 'vitest';
import { residentId } from '../src/resident-id.js';

const ctx = { pipelineType: 'input' as const };

describe('resident-id guard', () => {
  it('detects valid resident ID', async () => {
    const guard = residentId({ action: 'block' });
    const result = await guard.check('주민번호 901231-1000001', ctx);
    expect(result.passed).toBe(false);
  });

  it('rejects invalid checksum', async () => {
    const guard = residentId({ action: 'block' });
    const result = await guard.check('번호 901231-1234567', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects without checksum when disabled', async () => {
    const guard = residentId({ action: 'block', validateChecksum: false });
    const result = await guard.check('번호 901231-1234567', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks preserving first digit of back', async () => {
    const guard = residentId({ action: 'mask' });
    const result = await guard.check('주민번호: 901231-1000001', ctx);
    expect(result.passed).toBe(true);
    expect(result.action).toBe('override');
    expect(result.overrideText).toContain('901231-1******');
    expect(result.overrideText).not.toContain('1000001');
  });

  it('allows clean text', async () => {
    const guard = residentId({ action: 'block' });
    const result = await guard.check('안녕하세요', ctx);
    expect(result.passed).toBe(true);
  });
});
