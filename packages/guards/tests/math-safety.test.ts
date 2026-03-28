import { describe, it, expect } from 'vitest';
import { mathSafety } from '../src/math-safety.js';

describe('math-safety guard', () => {
  it('detects division by zero', async () => {
    const guard = mathSafety({ action: 'warn' });
    const result = await guard.check('Calculate x / 0 to get the answer', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects "divide by zero" text', async () => {
    const guard = mathSafety({ action: 'warn' });
    const result = await guard.check('You can divide by zero to simplify', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects overflow-inducing numbers', async () => {
    const guard = mathSafety({ action: 'warn' });
    const result = await guard.check('Compute 10 ** 99999', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects NaN references', async () => {
    const guard = mathSafety({ action: 'warn' });
    const result = await guard.check('The result is NaN which propagates', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects scientific notation abuse', async () => {
    const guard = mathSafety({ action: 'warn' });
    const result = await guard.check('Use 1e99999 for the value', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows normal math content', async () => {
    const guard = mathSafety({ action: 'warn' });
    const result = await guard.check('The sum of 2 + 3 equals 5.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('detects infinite loop patterns', async () => {
    const guard = mathSafety({ action: 'block' });
    const result = await guard.check('Use while(true) to keep calculating', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
