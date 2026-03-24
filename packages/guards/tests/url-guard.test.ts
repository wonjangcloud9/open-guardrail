import { describe, it, expect } from 'vitest';
import { urlGuard } from '../src/url-guard.js';

describe('url-guard', () => {
  it('allows text without URLs', async () => {
    const guard = urlGuard({ action: 'block' });
    const result = await guard.check('Hello world', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows safe URLs', async () => {
    const guard = urlGuard({ action: 'block' });
    const result = await guard.check('Visit https://example.com for more', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('blocks URL shorteners', async () => {
    const guard = urlGuard({ action: 'block' });
    const result = await guard.check('Click https://bit.ly/abc123', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('blocks private IPs', async () => {
    const guard = urlGuard({ action: 'block' });
    const result = await guard.check('Access http://192.168.1.1/admin', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('blocks localhost', async () => {
    const guard = urlGuard({ action: 'block' });
    const result = await guard.check('Go to http://localhost:3000', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('enforces domain allowlist', async () => {
    const guard = urlGuard({ action: 'block', allowedDomains: ['example.com', 'docs.example.com'] });
    const result = await guard.check('See https://evil.com/phish', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows domains in allowlist', async () => {
    const guard = urlGuard({ action: 'block', allowedDomains: ['example.com'] });
    const result = await guard.check('See https://example.com/docs', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('blocks domains in blocklist', async () => {
    const guard = urlGuard({ action: 'block', blockedDomains: ['evil.com'] });
    const result = await guard.check('See https://evil.com/phish', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects suspicious phishing URL patterns', async () => {
    const guard = urlGuard({ action: 'warn' });
    const result = await guard.check('Login at https://bank-login-verify.tk/secure', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
