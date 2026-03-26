import { describe, it, expect } from 'vitest';
import { urlExtract } from '../src/url-extract.js';
const ctx = { pipelineType: 'input' as const };
describe('url-extract', () => {
  it('blocks blocked domains', async () => {
    const g = urlExtract({ action: 'block', blockedDomains: ['evil.com'] });
    expect((await g.check('Visit https://evil.com/page', ctx)).passed).toBe(false);
  });
  it('masks URLs', async () => {
    const g = urlExtract({ action: 'mask' });
    const r = await g.check('See https://example.com', ctx);
    expect(r.overrideText).toContain('[URL]');
  });
  it('allows clean text', async () => {
    const g = urlExtract({ action: 'block', blockedDomains: ['evil.com'] });
    expect((await g.check('Hello world', ctx)).passed).toBe(true);
  });
});
