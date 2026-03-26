import { describe, it, expect } from 'vitest';
import { xssGuard } from '../src/xss-guard.js';

const ctx = { pipelineType: 'input' as const };

describe('xss-guard', () => {
  it('detects script tags', async () => {
    const guard = xssGuard({ action: 'block' });
    const result = await guard.check('<script>alert("xss")</script>', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('script-tag');
  });

  it('detects javascript: URI', async () => {
    const guard = xssGuard({ action: 'block' });
    const result = await guard.check('javascript:alert(1)', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects event handlers', async () => {
    const guard = xssGuard({ action: 'block' });
    const result = await guard.check('<img onerror=alert(1)>', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects iframe injection', async () => {
    const guard = xssGuard({ action: 'block' });
    const result = await guard.check('<iframe src="evil.com"></iframe>', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects DOM manipulation', async () => {
    const guard = xssGuard({ action: 'block' });
    const result = await guard.check('document.cookie', ctx);
    expect(result.passed).toBe(false);
  });

  it('sanitizes XSS content', async () => {
    const guard = xssGuard({ action: 'sanitize' });
    const result = await guard.check('<script>alert("xss")</script>hello', ctx);
    expect(result.passed).toBe(true);
    expect(result.action).toBe('override');
    expect(result.overrideText).not.toContain('<script>');
  });

  it('allows clean text', async () => {
    const guard = xssGuard({ action: 'block' });
    const result = await guard.check('Hello, how are you today?', ctx);
    expect(result.passed).toBe(true);
  });
});
