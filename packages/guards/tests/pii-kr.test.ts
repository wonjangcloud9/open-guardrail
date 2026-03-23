import { describe, it, expect } from 'vitest';
import { piiKr } from '../src/pii-kr.js';

const ctx = { pipelineType: 'input' as const };

describe('pii-kr guard', () => {
  it('detects valid resident ID', async () => {
    const guard = piiKr({ entities: ['resident-id'], action: 'block' });
    const result = await guard.check('주민번호 901231-1000001', ctx);
    expect(result.passed).toBe(false);
  });

  it('rejects resident ID with invalid checksum', async () => {
    const guard = piiKr({ entities: ['resident-id'], action: 'block' });
    const result = await guard.check('번호 901231-1234567', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects passport number', async () => {
    const guard = piiKr({ entities: ['passport'], action: 'block' });
    const result = await guard.check('여권 M12345678', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects driver license', async () => {
    const guard = piiKr({ entities: ['driver-license'], action: 'block' });
    const result = await guard.check('면허 11-22-333333-44', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects business registration number', async () => {
    const guard = piiKr({ entities: ['business-id'], action: 'block' });
    const result = await guard.check('사업자 123-45-67890', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects health insurance number near keyword', async () => {
    const guard = piiKr({ entities: ['health-insurance'], action: 'block' });
    const result = await guard.check('건강보험 번호 12345678901234', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects foreigner ID', async () => {
    const guard = piiKr({ entities: ['foreigner-id'], action: 'block' });
    const result = await guard.check('외국인 901231-5123456', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks resident ID correctly', async () => {
    const guard = piiKr({ entities: ['resident-id'], action: 'mask' });
    const result = await guard.check('번호: 901231-1000001', ctx);
    expect(result.passed).toBe(true);
    expect(result.action).toBe('override');
    expect(result.overrideText).toContain('[주민등록번호]');
    expect(result.overrideText).not.toContain('901231-1000001');
  });

  it('masks passport correctly', async () => {
    const guard = piiKr({ entities: ['passport'], action: 'mask' });
    const result = await guard.check('여권 M12345678', ctx);
    expect(result.overrideText).toContain('[여권번호]');
  });

  it('allows clean text', async () => {
    const guard = piiKr({
      entities: ['resident-id', 'passport', 'driver-license'],
      action: 'block',
    });
    const result = await guard.check('안녕하세요 반갑습니다', ctx);
    expect(result.passed).toBe(true);
  });
});
