import { describe, it, expect } from 'vitest';
import { latencyBudget } from '../src/latency-budget.js';

describe('latency-budget guard', () => {
  it('passes within budget', async () => {
    const guard = latencyBudget({ action: 'block', maxLatencyMs: 1000 });
    if (guard.init) await guard.init();
    const r = await guard.check('test', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });

  it('has latencyMs', async () => {
    const guard = latencyBudget({ action: 'block' });
    const r = await guard.check('test', { pipelineType: 'input' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
