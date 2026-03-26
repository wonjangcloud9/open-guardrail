import { describe, it, expect } from 'vitest';
import { validRange } from '../src/valid-range.js';

const ctx = { pipelineType: 'output' as const };

describe('valid-range guard', () => {
  it('blocks numbers above max', async () => {
    const guard = validRange({ action: 'block', max: 100 });
    const result = await guard.check('The value is 150', ctx);
    expect(result.passed).toBe(false);
  });

  it('blocks numbers below min', async () => {
    const guard = validRange({ action: 'block', min: 0 });
    const result = await guard.check('Temperature: -5 degrees', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows numbers within range', async () => {
    const guard = validRange({ action: 'block', min: 0, max: 100 });
    const result = await guard.check('Score: 85 out of 100', ctx);
    expect(result.passed).toBe(true);
  });

  it('handles decimal numbers', async () => {
    const guard = validRange({ action: 'block', min: 0, max: 1 });
    const result = await guard.check('Probability: 0.95', ctx);
    expect(result.passed).toBe(true);
  });

  it('reports out-of-range details', async () => {
    const guard = validRange({ action: 'warn', min: 0, max: 10 });
    const result = await guard.check('Values: 5, 15, -3', ctx);
    expect(result.details?.outOfRange.length).toBe(2);
  });
});
