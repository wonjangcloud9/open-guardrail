import { describe, it, expect } from 'vitest';
import { profanityDe } from '../src/profanity-de.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-de', () => {
  it('detects "Scheiße"', async () => {
    const g = profanityDe({ action: 'block' });
    expect((await g.check('Das ist Scheiße', ctx)).passed).toBe(false);
  });
  it('detects "Arschloch"', async () => {
    const g = profanityDe({ action: 'block' });
    expect((await g.check('Du bist ein Arschloch', ctx)).passed).toBe(false);
  });
  it('detects "Vollidiot"', async () => {
    const g = profanityDe({ action: 'warn' });
    const r = await g.check('So ein Vollidiot', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean German text', async () => {
    const g = profanityDe({ action: 'block' });
    expect((await g.check('Guten Morgen, wie geht es Ihnen', ctx)).passed).toBe(true);
  });
  it('returns matched details', async () => {
    const g = profanityDe({ action: 'block' });
    const r = await g.check('Drecksack und Penner', ctx);
    expect(r.details?.matched).toContain('drecksack');
  });
  it('is case insensitive', async () => {
    const g = profanityDe({ action: 'block' });
    expect((await g.check('du WICHSER', ctx)).passed).toBe(false);
  });
});
