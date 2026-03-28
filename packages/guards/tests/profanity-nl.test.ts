import { describe, it, expect } from 'vitest';
import { profanityNl } from '../src/profanity-nl.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-nl', () => {
  it('detects godverdomme', async () => {
    const g = profanityNl({ action: 'block' });
    expect((await g.check('godverdomme wat een dag', ctx)).passed).toBe(false);
  });
  it('detects kanker', async () => {
    const g = profanityNl({ action: 'warn' });
    const r = await g.check('wat een kanker weer', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('detects klootzak', async () => {
    const g = profanityNl({ action: 'block' });
    expect((await g.check('hij is een klootzak', ctx)).passed).toBe(false);
  });
  it('detects hoer', async () => {
    const g = profanityNl({ action: 'block' });
    expect((await g.check('vuile hoer', ctx)).passed).toBe(false);
  });
  it('allows clean Dutch text', async () => {
    const g = profanityNl({ action: 'block' });
    expect((await g.check('Het weer is vandaag prachtig', ctx)).passed).toBe(true);
  });
  it('returns matched details', async () => {
    const g = profanityNl({ action: 'block' });
    const r = await g.check('wat een lul', ctx);
    expect(r.details?.matched).toContain('lul');
  });
});
