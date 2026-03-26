import { describe, it, expect } from 'vitest';
import { personalOpinion } from '../src/personal-opinion.js';
const ctx = { pipelineType: 'output' as const };

describe('personal-opinion guard', () => {
  it('detects "I think" opinion', async () => {
    const guard = personalOpinion({ action: 'warn' });
    const result = await guard.check('I think Python is the best language.', ctx);
    expect(result.passed).toBe(false);
  });
  it('detects "in my opinion"', async () => {
    const guard = personalOpinion({ action: 'block' });
    const result = await guard.check('In my opinion, this approach is better.', ctx);
    expect(result.passed).toBe(false);
  });
  it('allows objective text', async () => {
    const guard = personalOpinion({ action: 'block' });
    const result = await guard.check('Python was created by Guido van Rossum in 1991.', ctx);
    expect(result.passed).toBe(true);
  });
});
