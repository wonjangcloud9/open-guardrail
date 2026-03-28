import { describe, it, expect } from 'vitest';
import { passportDetect } from '../src/passport-detect.js';

describe('passport-detect guard', () => {
  it('detects US passport format', async () => {
    const guard = passportDetect({ action: 'block' });
    const result = await guard.check('Passport: C12345678', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects Korean passport format', async () => {
    const guard = passportDetect({ action: 'block' });
    const result = await guard.check('Passport: M12345678', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects EU passport format', async () => {
    const guard = passportDetect({ action: 'block' });
    const result = await guard.check('Passport: AB1234567', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = passportDetect({ action: 'block' });
    const result = await guard.check('I need to renew my travel document', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns action block', async () => {
    const guard = passportDetect({ action: 'block' });
    const result = await guard.check('Passport: E12345678', { pipelineType: 'input' });
    expect(result.action).toBe('block');
  });

  it('supports warn action', async () => {
    const guard = passportDetect({ action: 'warn' });
    const result = await guard.check('Passport: G12345678', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });
});
