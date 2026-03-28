import { describe, it, expect } from 'vitest';
import { apiRateGuard } from '../src/api-rate-guard.js';
const ctx = { pipelineType: 'input' as const };
describe('api-rate-guard', () => {
  it('allows requests when bucket has tokens', async () => {
    const g = apiRateGuard({ action: 'block', maxTokens: 5 });
    const r = await g.check('hello', ctx);
    expect(r.passed).toBe(true);
    expect(r.details?.remainingTokens).toBe(4);
  });
  it('blocks when bucket is empty', async () => {
    const g = apiRateGuard({ action: 'block', maxTokens: 2 });
    await g.check('req1', ctx);
    await g.check('req2', ctx);
    const r = await g.check('req3', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });
  it('warns instead of blocking', async () => {
    const g = apiRateGuard({ action: 'warn', maxTokens: 1 });
    await g.check('req1', ctx);
    const r = await g.check('req2', ctx);
    expect(r.action).toBe('warn');
  });
  it('uses default maxTokens of 100', async () => {
    const g = apiRateGuard({ action: 'block' });
    const r = await g.check('hello', ctx);
    expect(r.details?.maxTokens).toBe(100);
  });
  it('tracks remaining tokens accurately', async () => {
    const g = apiRateGuard({ action: 'block', maxTokens: 3 });
    await g.check('req1', ctx);
    await g.check('req2', ctx);
    const r = await g.check('req3', ctx);
    expect(r.details?.remainingTokens).toBe(0);
  });
  it('returns latency', async () => {
    const g = apiRateGuard({ action: 'block' });
    const r = await g.check('hello', ctx);
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
