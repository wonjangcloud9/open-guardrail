import { describe, it, expect } from 'vitest';
import { numericAccuracy } from '../src/numeric-accuracy.js';

describe('numeric-accuracy guard', () => {
  it('passes when no facts to check', async () => {
    const guard = numericAccuracy({ action: 'block' });
    const r = await guard.check('Hello world', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
  it('blocks inaccurate numeric claim', async () => {
    const guard = numericAccuracy({ action: 'block', facts: { population: 300000000 } });
    const r = await guard.check('The population is 50 people', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
