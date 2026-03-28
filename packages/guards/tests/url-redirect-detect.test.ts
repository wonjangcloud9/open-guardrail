import { describe, it, expect } from 'vitest';
import { urlRedirectDetect } from '../src/url-redirect-detect.js';

const ctx = { pipelineType: 'input' as const };

describe('url-redirect-detect guard', () => {
  it('detects open redirect via url param', async () => {
    const guard = urlRedirectDetect({ action: 'block' });
    const result = await guard.check('Visit ?url=http://evil.com', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects redirect param', async () => {
    const guard = urlRedirectDetect({ action: 'block' });
    const result = await guard.check('?redirect=http://attacker.com/steal', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects returnTo param', async () => {
    const guard = urlRedirectDetect({ action: 'block' });
    const result = await guard.check('?returnTo=http://phishing.com', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects SSRF via localhost', async () => {
    const guard = urlRedirectDetect({ action: 'block' });
    const result = await guard.check('Connect to http://127.0.0.1:8080/admin', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects data exfil via URL params', async () => {
    const guard = urlRedirectDetect({ action: 'warn' });
    const result = await guard.check('?url=http://evil.com?token=abc&secret=xyz', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('allows clean URLs', async () => {
    const guard = urlRedirectDetect({ action: 'block' });
    const result = await guard.check('Visit https://example.com/docs', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows normal query params', async () => {
    const guard = urlRedirectDetect({ action: 'block' });
    const result = await guard.check('?page=1&sort=name', ctx);
    expect(result.passed).toBe(true);
  });
});
