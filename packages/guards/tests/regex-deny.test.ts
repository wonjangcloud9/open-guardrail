import { describe, it, expect } from 'vitest';
import { regexDeny } from '../src/regex-deny.js';

const ctx = { pipelineType: 'input' as const };

describe('regex-deny guard', () => {
  it('blocks matching patterns', async () => {
    const guard = regexDeny({
      action: 'block',
      patterns: [{ pattern: '\\bpassword\\s*[:=]\\s*\\S+', label: 'password' }],
    });
    const result = await guard.check('password: secret123', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks matching patterns', async () => {
    const guard = regexDeny({
      action: 'mask',
      patterns: [{ pattern: '\\bpassword\\s*[:=]\\s*\\S+', label: 'password', maskWith: '[REDACTED]' }],
    });
    const result = await guard.check('password: secret123', ctx);
    expect(result.passed).toBe(true);
    expect(result.overrideText).toContain('[REDACTED]');
  });

  it('allows clean text', async () => {
    const guard = regexDeny({
      action: 'block',
      patterns: [{ pattern: 'SECRET_\\w+', label: 'secret' }],
    });
    const result = await guard.check('Hello world', ctx);
    expect(result.passed).toBe(true);
  });

  it('returns labels in message', async () => {
    const guard = regexDeny({
      action: 'warn',
      patterns: [
        { pattern: '\\bSSN:\\s*\\d{3}-\\d{2}-\\d{4}', label: 'SSN' },
        { pattern: '\\bemail:\\s*\\S+@\\S+', label: 'email' },
      ],
    });
    const result = await guard.check('SSN: 123-45-6789', ctx);
    expect(result.message).toContain('SSN');
  });
});
