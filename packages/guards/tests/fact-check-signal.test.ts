import { describe, it, expect } from 'vitest';
import { factCheckSignal } from '../src/fact-check-signal.js';
const ctx = { pipelineType: 'output' as const };
describe('fact-check-signal', () => {
  it('allows text with few claims', async () => {
    const g = factCheckSignal({ action: 'warn' });
    const r = await g.check('Studies show that exercise is beneficial.', ctx);
    expect(r.passed).toBe(true);
  });
  it('flags text with many unverified claims', async () => {
    const g = factCheckSignal({ action: 'warn', maxUnverifiedClaims: 1 });
    const text = 'Studies show 50% of people agree. Research proves this. Scientists say it is true.';
    const r = await g.check(text, ctx);
    expect(r.passed).toBe(false);
  });
  it('detects percentage claims', async () => {
    const g = factCheckSignal({ action: 'warn', maxUnverifiedClaims: 0 });
    const r = await g.check('About 73.5% of users prefer this option', ctx);
    expect(r.passed).toBe(false);
  });
  it('detects "it is a well-known fact"', async () => {
    const g = factCheckSignal({ action: 'warn', maxUnverifiedClaims: 0 });
    const r = await g.check('It is a well-known fact that water boils at 100C', ctx);
    expect(r.passed).toBe(false);
  });
  it('allows clean factual text', async () => {
    const g = factCheckSignal({ action: 'block' });
    expect((await g.check('The function returns a boolean value.', ctx)).passed).toBe(true);
  });
  it('respects maxUnverifiedClaims option', async () => {
    const g = factCheckSignal({ action: 'warn', maxUnverifiedClaims: 5 });
    const text = 'Studies show this. Research proves that. Scientists say so.';
    expect((await g.check(text, ctx)).passed).toBe(true);
  });
  it('includes claim count in details', async () => {
    const g = factCheckSignal({ action: 'warn' });
    const r = await g.check('Normal text here', ctx);
    expect(r.details).toHaveProperty('claimsFound');
  });
});
