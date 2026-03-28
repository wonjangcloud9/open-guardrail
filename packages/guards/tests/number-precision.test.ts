import { describe, it, expect } from 'vitest';
import { numberPrecision } from '../src/number-precision.js';

describe('number-precision guard', () => {
  it('detects excessive decimal places', async () => {
    const guard = numberPrecision({ action: 'warn' });
    const result = await guard.check('Pi is 3.14159265358979323846264.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows numbers within max decimal places', async () => {
    const guard = numberPrecision({ action: 'block', maxDecimalPlaces: 4 });
    const result = await guard.check('The value is 3.1416.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('respects custom maxDecimalPlaces', async () => {
    const guard = numberPrecision({ action: 'block', maxDecimalPlaces: 2 });
    const result = await guard.check('The price is 19.999.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows text without numbers', async () => {
    const guard = numberPrecision({ action: 'block' });
    const result = await guard.check('Hello world.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects inconsistent precision', async () => {
    const guard = numberPrecision({ action: 'warn' });
    const text = 'Compare 3.1 vs 2.71828182845 vs 1.4142135623730951.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns score within range', async () => {
    const guard = numberPrecision({ action: 'warn' });
    const result = await guard.check('Value is 1.123456789012345.', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
