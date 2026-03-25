import { describe, it, expect } from 'vitest';
import { markdownSanitize } from '../src/markdown-sanitize.js';

const ctx = { pipelineType: 'output' as const };

describe('markdownSanitize', () => {
  const guard = markdownSanitize({ action: 'block' });

  it('allows safe markdown', async () => {
    const r = await guard.check('# Hello\n\nThis is **bold** and [a link](https://example.com)', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects javascript: links', async () => {
    const r = await guard.check('[click me](javascript:alert(1))', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });

  it('detects data: URLs', async () => {
    const r = await guard.check('[img](data:text/html,<script>alert(1)</script>)', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects script tags', async () => {
    const r = await guard.check('Hello <script>alert("xss")</script> world', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects iframe tags', async () => {
    const r = await guard.check('<iframe src="evil.com"></iframe>', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects event handlers', async () => {
    const r = await guard.check('<img onerror="alert(1)" src="x">', ctx);
    expect(r.passed).toBe(false);
  });

  it('sanitizes in override mode', async () => {
    const overrideGuard = markdownSanitize({ action: 'override' });
    const r = await overrideGuard.check('[click](javascript:alert(1))\n\nSafe text', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('override');
    expect(r.overrideText).toContain('blocked');
    expect(r.overrideText).toContain('Safe text');
  });

  it('respects rule options', async () => {
    const noScript = markdownSanitize({ action: 'block', rules: { htmlTags: false } });
    const r = await noScript.check('<script>alert(1)</script>', ctx);
    expect(r.passed).toBe(true);
  });

  it('detects style expression injection', async () => {
    const r = await guard.check('<div style="background: expression(alert(1))">', ctx);
    expect(r.passed).toBe(false);
  });
});
