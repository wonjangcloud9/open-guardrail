import { describe, it, expect } from 'vitest';
import { profanityId } from '../src/profanity-id.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-id', () => {
  it('detects Indonesian profanity', async () => {
    const g = profanityId({ action: 'block' });
    expect((await g.check('dasar bangsat kamu', ctx)).passed).toBe(false);
  });
  it('detects goblok', async () => {
    const g = profanityId({ action: 'warn' });
    const r = await g.check('kamu goblok banget', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean Indonesian text', async () => {
    const g = profanityId({ action: 'block' });
    expect((await g.check('Selamat pagi, apa kabar?', ctx)).passed).toBe(true);
  });
  it('detects multiple profanities', async () => {
    const g = profanityId({ action: 'block' });
    const r = await g.check('anjing tolol bego', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.matched.length).toBeGreaterThanOrEqual(2);
  });
  it('is case insensitive', async () => {
    const g = profanityId({ action: 'block' });
    expect((await g.check('BANGSAT', ctx)).passed).toBe(false);
  });
  it('returns allow for clean text', async () => {
    const g = profanityId({ action: 'block' });
    expect((await g.check('Terima kasih banyak', ctx)).action).toBe('allow');
  });
});
