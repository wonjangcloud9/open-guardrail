import { describe, it, expect } from 'vitest';
import { responseHelpfulness } from '../src/response-helpfulness.js';

describe('response-helpfulness guard', () => {
  it('detects non-answer "I don\'t know"', async () => {
    const guard = responseHelpfulness({ action: 'warn' });
    const result = await guard.check("I don't know.", { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects circular response', async () => {
    const guard = responseHelpfulness({ action: 'warn' });
    const result = await guard.check('As I just mentioned above, the answer was already stated earlier.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects too-short response', async () => {
    const guard = responseHelpfulness({ action: 'warn' });
    const result = await guard.check('OK', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes helpful response', async () => {
    const guard = responseHelpfulness({ action: 'warn' });
    const result = await guard.check('The capital of France is Paris. It has been the capital since the 10th century.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects restatement of question', async () => {
    const guard = responseHelpfulness({ action: 'warn' });
    const result = await guard.check('What is the weather today. The weather today is what.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns score between 0 and 1', async () => {
    const guard = responseHelpfulness({ action: 'warn' });
    const result = await guard.check("I'm not sure.", { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
