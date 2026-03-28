import { describe, it, expect } from 'vitest';
import { emailDomainCheck } from '../src/email-domain-check.js';

describe('email-domain-check', () => {
  it('allows valid email domains', async () => {
    const guard = emailDomainCheck({ action: 'block' });
    const result = await guard.check('Contact us at user@gmail.com', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('blocks disposable email domains', async () => {
    const guard = emailDomainCheck({ action: 'block' });
    const result = await guard.check('My email is test@mailinator.com', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.details?.issues).toContain('disposable:mailinator.com');
  });

  it('detects typosquatting domains', async () => {
    const guard = emailDomainCheck({ action: 'warn' });
    const result = await guard.check('Send to user@gmial.com', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('enforces allowed domains', async () => {
    const guard = emailDomainCheck({ action: 'block', allowedDomains: ['company.com'] });
    const result = await guard.check('user@external.com', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('passes when domain is in allowed list', async () => {
    const guard = emailDomainCheck({ action: 'block', allowedDomains: ['company.com'] });
    const result = await guard.check('user@company.com', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows text without emails', async () => {
    const guard = emailDomainCheck({ action: 'block' });
    const result = await guard.check('No email here', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects guerrillamail as disposable', async () => {
    const guard = emailDomainCheck({ action: 'block' });
    const result = await guard.check('test@guerrillamail.com', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
