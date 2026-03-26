import { describe, it, expect } from 'vitest';
import { phoneFormat } from '../src/phone-format.js';

const ctx = { pipelineType: 'input' as const };

describe('phone-format guard', () => {
  it('detects US phone number', async () => {
    const guard = phoneFormat({ action: 'block', regions: ['us'] });
    const result = await guard.check('Call 555-123-4567', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects Korean phone number', async () => {
    const guard = phoneFormat({ action: 'block', regions: ['kr'] });
    const result = await guard.check('전화 010-1234-5678', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects Chinese phone number', async () => {
    const guard = phoneFormat({ action: 'block', regions: ['cn'] });
    const result = await guard.check('手机 13812345678', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects international format', async () => {
    const guard = phoneFormat({ action: 'block', regions: ['international'] });
    const result = await guard.check('Phone: +82-10-1234-5678', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks phone numbers', async () => {
    const guard = phoneFormat({ action: 'mask', regions: ['kr'] });
    const result = await guard.check('번호: 010-1234-5678', ctx);
    expect(result.passed).toBe(true);
    expect(result.overrideText).toContain('[PHONE]');
  });

  it('allows text without phones', async () => {
    const guard = phoneFormat({ action: 'block' });
    const result = await guard.check('Hello world', ctx);
    expect(result.passed).toBe(true);
  });
});
