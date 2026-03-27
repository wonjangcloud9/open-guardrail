import { describe, it, expect } from 'vitest';
import { outputDeterminism } from '../src/output-determinism.js';

describe('output-determinism guard', () => {
  it('passes clear answer', async () => {
    const guard = outputDeterminism({ action: 'warn' });
    const r = await guard.check('The capital of France is Paris.', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('warns on hedging', async () => {
    const guard = outputDeterminism({ action: 'warn', maxHedgingRatio: 0.05 });
    const r = await guard.check('Maybe perhaps possibly it might could be that I think it seems probably likely unclear uncertain', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('has latencyMs', async () => {
    const guard = outputDeterminism({ action: 'warn' });
    const r = await guard.check('test', { pipelineType: 'output' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
