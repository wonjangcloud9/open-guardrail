import { describe, it, expect } from 'vitest';
import { profanityTr } from '../src/profanity-tr.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-tr', () => {
  it('detects Turkish profanity', async () => {
    const g = profanityTr({ action: 'block' });
    expect((await g.check('bu ne amk', ctx)).passed).toBe(false);
  });
  it('detects orospu', async () => {
    const g = profanityTr({ action: 'warn' });
    const r = await g.check('orospu çocuğu', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('detects siktir', async () => {
    const g = profanityTr({ action: 'block' });
    expect((await g.check('siktir git', ctx)).passed).toBe(false);
  });
  it('detects göt', async () => {
    const g = profanityTr({ action: 'block' });
    expect((await g.check('göt oldu', ctx)).passed).toBe(false);
  });
  it('allows clean Turkish text', async () => {
    const g = profanityTr({ action: 'block' });
    expect((await g.check('Bugün hava çok güzel', ctx)).passed).toBe(true);
  });
  it('returns matched details', async () => {
    const g = profanityTr({ action: 'block' });
    const r = await g.check('ne bok yiyorsun', ctx);
    expect(r.details?.matched).toContain('bok');
  });
});
