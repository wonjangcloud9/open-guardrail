import { describe, it, expect } from 'vitest';
import { gdprCompliance } from '../src/gdpr-compliance.js';

describe('gdpr-compliance guard', () => {
  it('detects indefinite data retention', async () => {
    const guard = gdprCompliance({ action: 'block' });
    const result = await guard.check('We store user data indefinitely for analytics', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects consent violations', async () => {
    const guard = gdprCompliance({ action: 'warn' });
    const result = await guard.check('Data is collected without user consent', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects implied consent', async () => {
    const guard = gdprCompliance({ action: 'block' });
    const result = await guard.check('We use implied consent for marketing emails', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects data transfer violations', async () => {
    const guard = gdprCompliance({ action: 'block' });
    const result = await guard.check('We share user data with third-party vendors', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects right-to-erasure violations', async () => {
    const guard = gdprCompliance({ action: 'block' });
    const result = await guard.check('We cannot delete your account records', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows GDPR-compliant text', async () => {
    const guard = gdprCompliance({ action: 'block' });
    const result = await guard.check('Your data is encrypted and stored for 30 days with your explicit consent.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('respects requireConsent option', async () => {
    const guard = gdprCompliance({ action: 'block', requireConsent: false });
    const result = await guard.check('Data is collected without user consent', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
