import { describe, it, expect } from 'vitest';
import { adversarialSuffix } from '../src/adversarial-suffix.js';

describe('adversarial-suffix guard', () => {
  it('passes normal text', async () => {
    const guard = adversarialSuffix({ action: 'block' });
    const r = await guard.check('What is the weather today', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });
  it('returns latencyMs', async () => {
    const guard = adversarialSuffix({ action: 'block' });
    const r = await guard.check('What is the weather today', { pipelineType: 'input' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
