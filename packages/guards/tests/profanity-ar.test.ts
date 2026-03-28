import { describe, it, expect } from 'vitest';
import { profanityAr } from '../src/profanity-ar.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-ar', () => {
  it('detects Arabic profanity "كلب"', async () => {
    const g = profanityAr({ action: 'block' });
    expect((await g.check('أنت كلب', ctx)).passed).toBe(false);
  });
  it('detects "حمار"', async () => {
    const g = profanityAr({ action: 'block' });
    expect((await g.check('يا حمار', ctx)).passed).toBe(false);
  });
  it('detects multi-word "ابن الحرام"', async () => {
    const g = profanityAr({ action: 'warn' });
    const r = await g.check('هو ابن الحرام', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean Arabic text', async () => {
    const g = profanityAr({ action: 'block' });
    expect((await g.check('مرحبا، كيف حالك؟', ctx)).passed).toBe(true);
  });
  it('returns score based on match count', async () => {
    const g = profanityAr({ action: 'block' });
    const r = await g.check('كلب حمار زبالة', ctx);
    expect(r.score).toBe(1.0);
  });
  it('has correct metadata', async () => {
    const g = profanityAr({ action: 'block' });
    expect(g.name).toBe('profanity-ar');
    expect(g.category).toBe('locale');
  });
});
