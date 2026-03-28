import { describe, it, expect } from 'vitest';
import { profanityVi } from '../src/profanity-vi.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-vi', () => {
  it('detects Vietnamese profanity', async () => {
    const g = profanityVi({ action: 'block' });
    expect((await g.check('đụ mẹ mày', ctx)).passed).toBe(false);
  });
  it('detects single word profanity', async () => {
    const g = profanityVi({ action: 'warn' });
    const r = await g.check('thằng ngu quá', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean Vietnamese text', async () => {
    const g = profanityVi({ action: 'block' });
    expect((await g.check('Xin chào, tôi là sinh viên', ctx)).passed).toBe(true);
  });
  it('detects multiple profanities', async () => {
    const g = profanityVi({ action: 'block' });
    const r = await g.check('đần khốn đéo hiểu gì', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.matched.length).toBeGreaterThanOrEqual(2);
  });
  it('returns score based on match count', async () => {
    const g = profanityVi({ action: 'block' });
    const r = await g.check('đụ địt lồn cặc', ctx);
    expect(r.score).toBeGreaterThan(0);
  });
  it('returns allow action for clean text', async () => {
    const g = profanityVi({ action: 'block' });
    const r = await g.check('Hôm nay trời đẹp quá', ctx);
    expect(r.action).toBe('allow');
  });
});
