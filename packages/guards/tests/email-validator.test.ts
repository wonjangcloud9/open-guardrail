import { describe, it, expect } from 'vitest';
import { emailValidator } from '../src/email-validator.js';

const ctx = { pipelineType: 'input' as const };

describe('email-validator guard', () => {
  it('blocks disposable email domains', async () => {
    const guard = emailValidator({ action: 'block' });
    const result = await guard.check('contact: user@mailinator.com', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows legitimate email domains', async () => {
    const guard = emailValidator({ action: 'block' });
    const result = await guard.check('contact: user@gmail.com', ctx);
    expect(result.passed).toBe(true);
  });

  it('blocks specific domains via blockedDomains', async () => {
    const guard = emailValidator({
      action: 'block',
      blockDisposable: false,
      blockedDomains: ['competitor.com'],
    });
    const result = await guard.check('email: admin@competitor.com', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows specific domains via allowedDomains', async () => {
    const guard = emailValidator({
      action: 'block',
      allowedDomains: ['mailinator.com'],
    });
    const result = await guard.check('user@mailinator.com', ctx);
    expect(result.passed).toBe(true);
  });

  it('masks disposable emails', async () => {
    const guard = emailValidator({ action: 'mask' });
    const result = await guard.check('email: test@yopmail.com', ctx);
    expect(result.passed).toBe(true);
    expect(result.overrideText).toContain('[EMAIL]');
  });

  it('allows text without emails', async () => {
    const guard = emailValidator({ action: 'block' });
    const result = await guard.check('Hello, nice to meet you', ctx);
    expect(result.passed).toBe(true);
  });
});
