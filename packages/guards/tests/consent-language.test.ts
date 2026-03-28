import { describe, it, expect } from 'vitest';
import { consentLanguage } from '../src/consent-language.js';

describe('consent-language guard', () => {
  it('detects "by continuing you agree" pattern', async () => {
    const guard = consentLanguage({ action: 'block' });
    const result = await guard.check('By continuing you agree to our terms', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects pre-ticked consent', async () => {
    const guard = consentLanguage({ action: 'block' });
    const result = await guard.check('The pre-ticked checkbox grants consent for marketing', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects forced consent', async () => {
    const guard = consentLanguage({ action: 'warn' });
    const result = await guard.check('You must agree to all terms to proceed', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects auto-enrollment', async () => {
    const guard = consentLanguage({ action: 'block' });
    const result = await guard.check('Users are automatically enrolled in the program', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows clean consent language', async () => {
    const guard = consentLanguage({ action: 'block' });
    const result = await guard.check('Please review our privacy policy and choose your preferences', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns matched patterns in details', async () => {
    const guard = consentLanguage({ action: 'block' });
    const result = await guard.check('Accept all cookies. By continuing you agree to everything', { pipelineType: 'output' });
    expect(result.details).toBeDefined();
    expect((result.details as any).matched.length).toBeGreaterThanOrEqual(1);
  });
});
