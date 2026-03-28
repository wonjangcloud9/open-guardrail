import { describe, it, expect } from 'vitest';
import { piiContext } from '../src/pii-context.js';

const ctx = { pipelineType: 'output' as const };

describe('pii-context guard', () => {
  it('detects PII near share action', async () => {
    const guard = piiContext({ action: 'block' });
    const result = await guard.check('Please share this SSN 123-45-6789 with the team', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects email near post action', async () => {
    const guard = piiContext({ action: 'block' });
    const result = await guard.check('post john@example.com on the forum', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects PII near tweet action', async () => {
    const guard = piiContext({ action: 'warn' });
    const result = await guard.check('tweet this phone 555-123-4567 publicly', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects PII in URL params', async () => {
    const guard = piiContext({ action: 'block' });
    const result = await guard.check('https://api.com?user=test&ssn=123-45-6789', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects PII near public keyword', async () => {
    const guard = piiContext({ action: 'block' });
    const result = await guard.check('Make publicly available: user@email.com', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows text without PII', async () => {
    const guard = piiContext({ action: 'block' });
    const result = await guard.check('Share this article with your friends', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows PII without sharing context', async () => {
    const guard = piiContext({ action: 'block' });
    const result = await guard.check('The record shows 123-45-6789 on file', ctx);
    expect(result.passed).toBe(true);
  });
});
