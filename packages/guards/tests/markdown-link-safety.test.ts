import { describe, it, expect } from 'vitest';
import { markdownLinkSafety } from '../src/markdown-link-safety.js';

describe('markdown-link-safety', () => {
  it('allows safe markdown links', async () => {
    const guard = markdownLinkSafety({ action: 'block' });
    const result = await guard.check('[Example](https://example.com)', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('blocks javascript: URIs in links', async () => {
    const guard = markdownLinkSafety({ action: 'block' });
    const result = await guard.check('[Click](javascript:alert(1))', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('blocks data: URIs in links', async () => {
    const guard = markdownLinkSafety({ action: 'block' });
    const result = await guard.check('[Download](data:text/html;base64,abc)', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects path traversal in links', async () => {
    const guard = markdownLinkSafety({ action: 'warn' });
    const result = await guard.check('[Config](../../etc/passwd)', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects IP-based links', async () => {
    const guard = markdownLinkSafety({ action: 'block' });
    const result = await guard.check('[Admin](http://192.168.1.1/admin)', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects hidden links with empty text', async () => {
    const guard = markdownLinkSafety({ action: 'block' });
    const result = await guard.check('[](https://evil.com/track)', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows text without markdown links', async () => {
    const guard = markdownLinkSafety({ action: 'block' });
    const result = await guard.check('Just plain text', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
