import { describe, it, expect } from 'vitest';
import { profanityTh } from '../src/profanity-th.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-th', () => {
  it('detects Thai profanity', async () => {
    const g = profanityTh({ action: 'block' });
    expect((await g.check('ไอ้บ้า มาทำอะไร', ctx)).passed).toBe(false);
  });
  it('detects ควาย', async () => {
    const g = profanityTh({ action: 'warn' });
    const r = await g.check('มัน ควาย จริงๆ', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean Thai text', async () => {
    const g = profanityTh({ action: 'block' });
    expect((await g.check('สวัสดีครับ วันนี้อากาศดี', ctx)).passed).toBe(true);
  });
  it('detects multiple profanities', async () => {
    const g = profanityTh({ action: 'block' });
    const r = await g.check('เหี้ย ระยำ อีห่า', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.matched.length).toBeGreaterThanOrEqual(2);
  });
  it('returns score for matches', async () => {
    const g = profanityTh({ action: 'block' });
    const r = await g.check('เหี้ย เลว', ctx);
    expect(r.score).toBeGreaterThan(0);
  });
  it('returns allow for clean text', async () => {
    const g = profanityTh({ action: 'block' });
    expect((await g.check('ขอบคุณมากครับ', ctx)).action).toBe('allow');
  });
});
