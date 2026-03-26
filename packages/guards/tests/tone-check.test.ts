import { describe, it, expect } from 'vitest';
import { toneCheck } from '../src/tone-check.js';
const ctx = { pipelineType: 'output' as const };

describe('tone-check guard', () => {
  it('detects casual when formal expected', async () => {
    const guard = toneCheck({ action: 'warn', expected: 'formal' });
    const result = await guard.check('yo dude lol what up', ctx);
    expect(result.passed).toBe(false);
  });
  it('allows matching tone', async () => {
    const guard = toneCheck({ action: 'block', expected: 'friendly' });
    const result = await guard.check('Great question! Happy to help you with that.', ctx);
    expect(result.passed).toBe(true);
  });
  it('returns detected tone', async () => {
    const guard = toneCheck({ action: 'warn', expected: 'formal' });
    const result = await guard.check('Hey bro gonna check that out lol', ctx);
    expect(result.details?.detectedTone).toBeDefined();
  });
});
