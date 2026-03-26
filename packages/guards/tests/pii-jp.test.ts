import { describe, it, expect } from 'vitest';
import { piiJp } from '../src/pii-jp.js';

const ctx = { pipelineType: 'input' as const };

describe('pii-jp guard', () => {
  it('detects valid My Number', async () => {
    const guard = piiJp({ entities: ['my-number'], action: 'block' });
    const result = await guard.check('マイナンバー 1111 1111 1118', ctx);
    expect(result.passed).toBe(false);
  });

  it('rejects invalid My Number checksum', async () => {
    const guard = piiJp({ entities: ['my-number'], action: 'block' });
    const result = await guard.check('番号 1111 1111 1110', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects passport number', async () => {
    const guard = piiJp({ entities: ['passport'], action: 'block' });
    const result = await guard.check('パスポート TK1234567', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects corporate number', async () => {
    const guard = piiJp({ entities: ['corporate-number'], action: 'block' });
    const result = await guard.check('法人番号 1234567890123', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects health insurance number near keyword', async () => {
    const guard = piiJp({ entities: ['health-insurance'], action: 'block' });
    const result = await guard.check('保険者番号 12345678', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks My Number correctly', async () => {
    const guard = piiJp({ entities: ['my-number'], action: 'mask' });
    const result = await guard.check('番号: 1111 1111 1118', ctx);
    expect(result.passed).toBe(true);
    expect(result.action).toBe('override');
    expect(result.overrideText).toContain('[マイナンバー]');
  });

  it('masks passport correctly', async () => {
    const guard = piiJp({ entities: ['passport'], action: 'mask' });
    const result = await guard.check('パスポート TK1234567', ctx);
    expect(result.overrideText).toContain('[パスポート番号]');
  });

  it('allows clean text', async () => {
    const guard = piiJp({
      entities: ['my-number', 'passport', 'driver-license'],
      action: 'block',
    });
    const result = await guard.check('こんにちは、お元気ですか', ctx);
    expect(result.passed).toBe(true);
  });
});
