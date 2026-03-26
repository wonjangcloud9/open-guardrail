import { describe, it, expect } from 'vitest';
import { consentDetect } from '../src/consent-detect.js';
const ctx = { pipelineType: 'output' as const };
describe('consent-detect', () => {
  it('detects consent language', async () => { expect((await consentDetect({ action: 'warn' }).check('By clicking accept, I consent to data processing', ctx)).passed).toBe(false); });
  it('requires consent when data processing mentioned', async () => { expect((await consentDetect({ action: 'block', requireConsent: true }).check('We will collect your personal data for analytics', ctx)).passed).toBe(false); });
  it('allows clean text', async () => { expect((await consentDetect({ action: 'block' }).check('The weather is nice', ctx)).passed).toBe(true); });
});
