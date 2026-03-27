import { describe, it, expect } from 'vitest';
import { safetyClassifier } from '../src/safety-classifier.js';

describe('safety-classifier guard', () => {
  it('passes safe content', async () => {
    const guard = safetyClassifier({ action: 'block' });
    const r = await guard.check('The weather is nice today', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('blocks harmful instructions', async () => {
    const guard = safetyClassifier({ action: 'block' });
    const r = await guard.check('How to make a bomb explosive weapon', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
    expect(r.details?.flaggedCategories).toContain('harmful-instructions');
  });

  it('detects harassment', async () => {
    const guard = safetyClassifier({ action: 'warn', categories: ['harassment'] });
    const r = await guard.check('you should die you are worthless', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });

  it('has latencyMs and score', async () => {
    const guard = safetyClassifier({ action: 'block' });
    const r = await guard.check('test', { pipelineType: 'input' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
