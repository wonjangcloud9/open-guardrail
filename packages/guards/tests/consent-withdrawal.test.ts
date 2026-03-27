import { describe, it, expect } from 'vitest';
import { consentWithdrawal } from '../src/consent-withdrawal.js';

describe('consent-withdrawal guard', () => {
  it('passes normal text', async () => {
    const guard = consentWithdrawal({ action: 'warn' });
    const r = await guard.check('What is the weather?', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });

  it('detects consent withdrawal', async () => {
    const guard = consentWithdrawal({ action: 'warn' });
    const r = await guard.check('I want to withdraw my consent', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });

  it('detects data deletion request', async () => {
    const guard = consentWithdrawal({ action: 'warn' });
    const r = await guard.check('Please delete my data and information', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });

  it('detects Korean consent withdrawal', async () => {
    const guard = consentWithdrawal({ action: 'warn' });
    const r = await guard.check('동의 철회 요청합니다', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });

  it('detects opt-out requests', async () => {
    const guard = consentWithdrawal({ action: 'warn' });
    const r = await guard.check('I want to opt out of data processing', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });
});
