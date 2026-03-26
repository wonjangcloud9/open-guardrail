import { describe, it, expect } from 'vitest';
import { maxLinks } from '../src/max-links.js';
const ctx = { pipelineType: 'input' as const };

describe('max-links guard', () => {
  it('blocks too many URLs', async () => {
    const guard = maxLinks({ action: 'block', maxUrls: 2 });
    const result = await guard.check('Visit https://a.com https://b.com https://c.com', ctx);
    expect(result.passed).toBe(false);
  });
  it('allows within limit', async () => {
    const guard = maxLinks({ action: 'block', maxUrls: 5 });
    const result = await guard.check('Visit https://example.com', ctx);
    expect(result.passed).toBe(true);
  });
  it('counts emails separately', async () => {
    const guard = maxLinks({ action: 'block', maxEmails: 1 });
    const result = await guard.check('a@b.com c@d.com', ctx);
    expect(result.passed).toBe(false);
  });
});
