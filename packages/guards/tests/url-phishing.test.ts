import { describe, it, expect } from 'vitest';
import { urlPhishing } from '../src/url-phishing.js';

describe('url-phishing', () => {
  it('allows safe URLs', async () => {
    const guard = urlPhishing({ action: 'block' });
    const result = await guard.check('Visit https://example.com', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects suspicious subdomains', async () => {
    const guard = urlPhishing({ action: 'block' });
    const result = await guard.check('Go to https://login.bank.evil.com/verify', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects IP-based URLs', async () => {
    const guard = urlPhishing({ action: 'block' });
    const result = await guard.check('Visit http://192.168.1.1/login', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects data URIs', async () => {
    const guard = urlPhishing({ action: 'block' });
    const result = await guard.check('Click data:text/html;base64,PHNjcmlwdD4=', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects excessive URL depth', async () => {
    const guard = urlPhishing({ action: 'warn' });
    const result = await guard.check('https://evil.com/a/b/c/d/e/f/g/h/i/j', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows text without URLs', async () => {
    const guard = urlPhishing({ action: 'block' });
    const result = await guard.check('Just plain text here', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects homograph attacks with cyrillic chars', async () => {
    const guard = urlPhishing({ action: 'block' });
    const result = await guard.check('Visit https://\u0430pple.com/login', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
