import { describe, it, expect } from 'vitest';
import { privacyPolicy } from '../src/privacy-policy.js';

describe('privacy-policy guard', () => {
  it('detects "sell your data" violations', async () => {
    const guard = privacyPolicy({ action: 'block' });
    const result = await guard.check('We may sell your data to advertisers', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects COPPA violations', async () => {
    const guard = privacyPolicy({ action: 'block' });
    const result = await guard.check('We collect data from children under 13', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects "no opt-out" patterns', async () => {
    const guard = privacyPolicy({ action: 'warn' });
    const result = await guard.check('There is no opt-out available for tracking', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('allows compliant text', async () => {
    const guard = privacyPolicy({ action: 'block' });
    const result = await guard.check('We respect your privacy and offer full data deletion.', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('skips COPPA checks when disabled', async () => {
    const guard = privacyPolicy({ action: 'block', checkCoppa: false });
    const result = await guard.check('We collect data from children under 13', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects fingerprinting without disclosure', async () => {
    const guard = privacyPolicy({ action: 'block' });
    const result = await guard.check('We use fingerprinting without disclosure to users', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
