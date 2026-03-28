import { describe, it, expect } from 'vitest';
import { modelDenial } from '../src/model-denial.js';

describe('model-denial guard', () => {
  it('detects extremely long repeated characters', async () => {
    const guard = modelDenial({ action: 'block' });
    const result = await guard.check('A'.repeat(200), { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects extremely long single words', async () => {
    const guard = modelDenial({ action: 'block' });
    const result = await guard.check('abcdefg'.repeat(50), { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects deeply nested brackets', async () => {
    const guard = modelDenial({ action: 'block' });
    const nested = '{'.repeat(60) + '}'.repeat(60);
    const result = await guard.check(nested, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects input exceeding maxInputLength', async () => {
    const guard = modelDenial({ action: 'block', maxInputLength: 100 });
    const result = await guard.check('x'.repeat(150), { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = modelDenial({ action: 'block' });
    const result = await guard.check('Tell me about the history of computing.', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('detects repetitive pattern floods', async () => {
    const guard = modelDenial({ action: 'warn' });
    const result = await guard.check('abc'.repeat(50), { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('respects maxRepetitions option', async () => {
    const guard = modelDenial({ action: 'block', maxRepetitions: 5 });
    const result = await guard.check('aaaaaa normal text', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
