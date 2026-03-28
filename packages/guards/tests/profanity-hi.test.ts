import { describe, it, expect } from 'vitest';
import { profanityHi } from '../src/profanity-hi.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-hi', () => {
  it('detects Hindi profanity "हरामी"', async () => {
    const g = profanityHi({ action: 'block' });
    expect((await g.check('तू हरामी है', ctx)).passed).toBe(false);
  });
  it('detects "गधा"', async () => {
    const g = profanityHi({ action: 'block' });
    expect((await g.check('बड़ा गधा है', ctx)).passed).toBe(false);
  });
  it('detects "बकवास"', async () => {
    const g = profanityHi({ action: 'warn' });
    const r = await g.check('ये सब बकवास है', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean Hindi text', async () => {
    const g = profanityHi({ action: 'block' });
    expect((await g.check('नमस्ते, आप कैसे हैं?', ctx)).passed).toBe(true);
  });
  it('returns score', async () => {
    const g = profanityHi({ action: 'block' });
    const r = await g.check('हरामी गधा बकवास', ctx);
    expect(r.score).toBe(1.0);
  });
  it('has correct metadata', async () => {
    const g = profanityHi({ action: 'block' });
    expect(g.name).toBe('profanity-hi');
    expect(g.category).toBe('locale');
  });
});
