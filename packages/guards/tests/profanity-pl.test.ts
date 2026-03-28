import { describe, it, expect } from 'vitest';
import { profanityPl } from '../src/profanity-pl.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-pl', () => {
  it('detects kurwa', async () => {
    const g = profanityPl({ action: 'block' });
    expect((await g.check('kurwa mać', ctx)).passed).toBe(false);
  });
  it('detects gówno', async () => {
    const g = profanityPl({ action: 'warn' });
    const r = await g.check('co za gówno', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('detects skurwysyn', async () => {
    const g = profanityPl({ action: 'block' });
    expect((await g.check('ty skurwysyn', ctx)).passed).toBe(false);
  });
  it('detects dupek', async () => {
    const g = profanityPl({ action: 'block' });
    expect((await g.check('jaki dupek', ctx)).passed).toBe(false);
  });
  it('allows clean Polish text', async () => {
    const g = profanityPl({ action: 'block' });
    expect((await g.check('Dzisiaj jest piękny dzień', ctx)).passed).toBe(true);
  });
  it('returns matched details', async () => {
    const g = profanityPl({ action: 'block' });
    const r = await g.check('ty debil', ctx);
    expect(r.details?.matched).toContain('debil');
  });
});
