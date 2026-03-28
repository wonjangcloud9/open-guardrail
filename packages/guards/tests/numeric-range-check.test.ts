import { describe, it, expect } from 'vitest';
import { numericRangeCheck } from '../src/numeric-range-check.js';

describe('numeric-range-check guard', () => {
  it('detects percentage over 100', async () => {
    const guard = numericRangeCheck({ action: 'warn' });
    const result = await guard.check('The success rate is 150%', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects percentage of 200', async () => {
    const guard = numericRangeCheck({ action: 'warn' });
    const result = await guard.check('We achieved 200% efficiency', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects unreasonable Celsius temp', async () => {
    const guard = numericRangeCheck({ action: 'block' });
    const result = await guard.check('The temperature was 5000°C today', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects negative count', async () => {
    const guard = numericRangeCheck({ action: 'warn' });
    const result = await guard.check('There are -3 items in the cart', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows valid percentages', async () => {
    const guard = numericRangeCheck({ action: 'block' });
    const result = await guard.check('The success rate is 85%', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows reasonable temperatures', async () => {
    const guard = numericRangeCheck({ action: 'block' });
    const result = await guard.check('Today it is 25°C outside', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows text without numbers', async () => {
    const guard = numericRangeCheck({ action: 'block' });
    const result = await guard.check('Hello world', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
