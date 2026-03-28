import { describe, it, expect } from 'vitest';
import { profanityFr } from '../src/profanity-fr.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-fr', () => {
  it('detects "merde"', async () => {
    const g = profanityFr({ action: 'block' });
    expect((await g.check('C\'est de la merde', ctx)).passed).toBe(false);
  });
  it('detects "putain"', async () => {
    const g = profanityFr({ action: 'block' });
    expect((await g.check('Putain de bordel', ctx)).passed).toBe(false);
  });
  it('detects "connard"', async () => {
    const g = profanityFr({ action: 'warn' });
    const r = await g.check('Quel connard', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean French text', async () => {
    const g = profanityFr({ action: 'block' });
    expect((await g.check('Bonjour, comment allez-vous', ctx)).passed).toBe(true);
  });
  it('returns matched words in details', async () => {
    const g = profanityFr({ action: 'block' });
    const r = await g.check('Oh merde et bordel', ctx);
    expect(r.details?.matched).toContain('merde');
  });
  it('returns latency', async () => {
    const g = profanityFr({ action: 'block' });
    const r = await g.check('Salut le monde', ctx);
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
