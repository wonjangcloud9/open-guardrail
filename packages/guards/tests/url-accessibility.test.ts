import { describe, it, expect } from 'vitest';
import { urlAccessibility } from '../src/url-accessibility.js';

const ctx = { pipelineType: 'output' as const };

describe('url-accessibility guard', () => {
  it('passes well-formed markdown links', async () => {
    const guard = urlAccessibility({ action: 'warn' });
    const result = await guard.check('See [our docs](https://example.com/docs) for more.', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects "click here" links', async () => {
    const guard = urlAccessibility({ action: 'block' });
    const result = await guard.check('[click here](https://example.com)', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects raw URLs in prose', async () => {
    const guard = urlAccessibility({ action: 'warn' });
    const result = await guard.check('Visit https://example.com for info.', ctx);
    expect(result.passed).toBe(false);
  });

  it('passes text without URLs', async () => {
    const guard = urlAccessibility({ action: 'block' });
    const result = await guard.check('Plain text with no links.', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows raw URLs inside markdown links', async () => {
    const guard = urlAccessibility({ action: 'warn' });
    const result = await guard.check('[Example](https://example.com)', ctx);
    expect(result.passed).toBe(true);
  });

  it('returns issues in details', async () => {
    const guard = urlAccessibility({ action: 'warn' });
    const result = await guard.check('[click here](https://x.com) and https://raw.url', ctx);
    expect(result.details?.issues?.length).toBeGreaterThanOrEqual(1);
  });
});
