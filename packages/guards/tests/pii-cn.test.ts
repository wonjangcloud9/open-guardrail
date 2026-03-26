import { describe, it, expect } from 'vitest';
import { piiCn } from '../src/pii-cn.js';

const ctx = { pipelineType: 'input' as const };

describe('pii-cn guard', () => {
  it('detects valid ID card number', async () => {
    const guard = piiCn({ entities: ['id-card'], action: 'block' });
    const result = await guard.check('身份证号 110101199001010015', ctx);
    expect(result.passed).toBe(false);
  });

  it('rejects invalid ID card checksum', async () => {
    const guard = piiCn({ entities: ['id-card'], action: 'block' });
    const result = await guard.check('身份证号 110101199001010010', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects passport number', async () => {
    const guard = piiCn({ entities: ['passport'], action: 'block' });
    const result = await guard.check('护照 E12345678', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects phone number', async () => {
    const guard = piiCn({ entities: ['phone'], action: 'block' });
    const result = await guard.check('手机号 13812345678', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks ID card correctly', async () => {
    const guard = piiCn({ entities: ['id-card'], action: 'mask' });
    const result = await guard.check('号码: 110101199001010015', ctx);
    expect(result.passed).toBe(true);
    expect(result.action).toBe('override');
    expect(result.overrideText).toContain('[身份证号]');
    expect(result.overrideText).not.toContain('110101199001010015');
  });

  it('masks passport correctly', async () => {
    const guard = piiCn({ entities: ['passport'], action: 'mask' });
    const result = await guard.check('护照 E12345678', ctx);
    expect(result.overrideText).toContain('[护照号]');
  });

  it('masks phone correctly', async () => {
    const guard = piiCn({ entities: ['phone'], action: 'mask' });
    const result = await guard.check('电话 13812345678', ctx);
    expect(result.overrideText).toContain('[手机号]');
  });

  it('allows clean text', async () => {
    const guard = piiCn({
      entities: ['id-card', 'passport', 'phone'],
      action: 'block',
    });
    const result = await guard.check('你好，今天天气真好', ctx);
    expect(result.passed).toBe(true);
  });
});
