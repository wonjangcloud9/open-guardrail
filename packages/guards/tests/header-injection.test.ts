import { describe, it, expect } from 'vitest';
import { headerInjection } from '../src/header-injection.js';

const ctx = { pipelineType: 'input' as const };

describe('header-injection guard', () => {
  it('detects CRLF injection', async () => {
    const guard = headerInjection({ action: 'block' });
    const result = await guard.check('value\r\nInjected-Header: evil', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects encoded CRLF', async () => {
    const guard = headerInjection({ action: 'block' });
    const result = await guard.check('value%0D%0AInjected: evil', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects X-Forwarded-For manipulation', async () => {
    const guard = headerInjection({ action: 'block' });
    const result = await guard.check('X-Forwarded-For: 10.0.0.1', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects cookie injection', async () => {
    const guard = headerInjection({ action: 'warn' });
    const result = await guard.check('Set-Cookie: session=hijacked', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects host header injection', async () => {
    const guard = headerInjection({ action: 'block' });
    const result = await guard.check('Host: evil.com', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = headerInjection({ action: 'block' });
    const result = await guard.check('This is a normal message with no headers', ctx);
    expect(result.passed).toBe(true);
  });
});
