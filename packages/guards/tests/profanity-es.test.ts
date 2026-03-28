import { describe, it, expect } from 'vitest';
import { profanityEs } from '../src/profanity-es.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-es', () => {
  it('detects common Spanish profanity', async () => {
    const g = profanityEs({ action: 'block' });
    expect((await g.check('Eso es una mierda total', ctx)).passed).toBe(false);
  });
  it('detects "joder"', async () => {
    const g = profanityEs({ action: 'block' });
    expect((await g.check('Joder, qué mal', ctx)).passed).toBe(false);
  });
  it('detects "pendejo"', async () => {
    const g = profanityEs({ action: 'warn' });
    const r = await g.check('Eres un pendejo', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean Spanish text', async () => {
    const g = profanityEs({ action: 'block' });
    expect((await g.check('Buenos días, cómo estás', ctx)).passed).toBe(true);
  });
  it('detects multiple words', async () => {
    const g = profanityEs({ action: 'block' });
    const r = await g.check('Culo y mierda', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.matched).toContain('culo');
  });
  it('returns latency', async () => {
    const g = profanityEs({ action: 'block' });
    const r = await g.check('hola mundo', ctx);
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
