import { describe, it, expect } from 'vitest';
import { phoneCountryCheck } from '../src/phone-country-check.js';

describe('phone-country-check', () => {
  it('allows text without phone numbers', async () => {
    const guard = phoneCountryCheck({ action: 'block' });
    const result = await guard.check('No phone here', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows phones from allowed country codes', async () => {
    const guard = phoneCountryCheck({ action: 'block', allowedCountryCodes: ['1', '82'] });
    const result = await guard.check('Call +1 555-123-4567', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('blocks phones from restricted countries', async () => {
    const guard = phoneCountryCheck({ action: 'block', allowedCountryCodes: ['1'] });
    const result = await guard.check('Call +44 20 7946 0958', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects premium rate numbers', async () => {
    const guard = phoneCountryCheck({ action: 'warn' });
    const result = await guard.check('Call +1 900-555-1234', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects 976 premium prefix', async () => {
    const guard = phoneCountryCheck({ action: 'block' });
    const result = await guard.check('Dial +1 976-555-1234', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal domestic numbers with allowed codes', async () => {
    const guard = phoneCountryCheck({ action: 'block', allowedCountryCodes: ['82'] });
    const result = await guard.check('Call +82 10-1234-5678', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
