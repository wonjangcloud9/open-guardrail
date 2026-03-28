import { describe, it, expect } from 'vitest';
import { phoneFormatIntl } from '../src/phone-format-intl.js';

describe('phone-format-intl guard', () => {
  it('detects E.164 format', async () => {
    const guard = phoneFormatIntl({ action: 'block' });
    const result = await guard.check('Call me at +14155552671', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects US format with dashes', async () => {
    const guard = phoneFormatIntl({ action: 'warn' });
    const result = await guard.check('My number is 415-555-2671', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects UK format', async () => {
    const guard = phoneFormatIntl({ action: 'block' });
    const result = await guard.check('Ring 020-71234567 please', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects Korean format', async () => {
    const guard = phoneFormatIntl({ action: 'block' });
    const result = await guard.check('Phone: 02-1234-5678', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = phoneFormatIntl({ action: 'block' });
    const result = await guard.check('Hello world, how are you?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns score based on match count', async () => {
    const guard = phoneFormatIntl({ action: 'block' });
    const result = await guard.check('Call +14155552671 or 02-1234-5678', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
  });
});
