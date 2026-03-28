import { describe, it, expect } from 'vitest';
import { ibanDetect } from '../src/iban-detect.js';

describe('iban-detect guard', () => {
  it('detects German IBAN', async () => {
    const guard = ibanDetect({ action: 'block' });
    const result = await guard.check('IBAN: DE89370400440532013000', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects UK IBAN', async () => {
    const guard = ibanDetect({ action: 'block' });
    const result = await guard.check('Pay to GB29NWBK60161331926819', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects IBAN with spaces', async () => {
    const guard = ibanDetect({ action: 'block' });
    const result = await guard.check('IBAN: DE89 3704 0044 0532 0130 00', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = ibanDetect({ action: 'block' });
    const result = await guard.check('Please transfer the funds today', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns count in details', async () => {
    const guard = ibanDetect({ action: 'block' });
    const result = await guard.check('IBAN: DE89370400440532013000', { pipelineType: 'input' });
    expect(result.details?.ibanCount).toBe(1);
  });

  it('supports warn action', async () => {
    const guard = ibanDetect({ action: 'warn' });
    const result = await guard.check('IBAN: FR7630006000011234567890189', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });
});
