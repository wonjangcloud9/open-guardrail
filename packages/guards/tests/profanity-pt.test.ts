import { describe, it, expect } from 'vitest';
import { profanityPt } from '../src/profanity-pt.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-pt', () => {
  it('detects "merda"', async () => {
    const g = profanityPt({ action: 'block' });
    expect((await g.check('Isso é uma merda', ctx)).passed).toBe(false);
  });
  it('detects "caralho"', async () => {
    const g = profanityPt({ action: 'block' });
    expect((await g.check('Que caralho é isso', ctx)).passed).toBe(false);
  });
  it('detects multi-word "filho da puta"', async () => {
    const g = profanityPt({ action: 'block' });
    expect((await g.check('Esse filho da puta mentiu', ctx)).passed).toBe(false);
  });
  it('allows clean Portuguese text', async () => {
    const g = profanityPt({ action: 'block' });
    expect((await g.check('Bom dia, tudo bem', ctx)).passed).toBe(true);
  });
  it('warns instead of blocking', async () => {
    const g = profanityPt({ action: 'warn' });
    const r = await g.check('Vai tomar no cacete', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('returns matched details', async () => {
    const g = profanityPt({ action: 'block' });
    const r = await g.check('Porra e merda', ctx);
    expect(r.details?.matched).toContain('porra');
  });
});
