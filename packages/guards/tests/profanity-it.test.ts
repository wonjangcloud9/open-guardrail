import { describe, it, expect } from 'vitest';
import { profanityIt } from '../src/profanity-it.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-it', () => {
  it('detects Italian profanity "cazzo"', async () => {
    const g = profanityIt({ action: 'block' });
    expect((await g.check('Che cazzo fai?', ctx)).passed).toBe(false);
  });
  it('detects "vaffanculo"', async () => {
    const g = profanityIt({ action: 'block' });
    expect((await g.check('Vaffanculo!', ctx)).passed).toBe(false);
  });
  it('detects "stronzo"', async () => {
    const g = profanityIt({ action: 'warn' });
    const r = await g.check('Sei uno stronzo', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean Italian text', async () => {
    const g = profanityIt({ action: 'block' });
    expect((await g.check('Buongiorno, come stai?', ctx)).passed).toBe(true);
  });
  it('returns score based on match count', async () => {
    const g = profanityIt({ action: 'block' });
    const r = await g.check('cazzo merda stronzo', ctx);
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThanOrEqual(1);
  });
  it('has correct metadata', async () => {
    const g = profanityIt({ action: 'block' });
    expect(g.name).toBe('profanity-it');
    expect(g.category).toBe('locale');
  });
});
