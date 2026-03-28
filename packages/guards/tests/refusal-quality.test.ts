import { describe, it, expect } from 'vitest';
import { refusalQuality } from '../src/refusal-quality.js';

describe('refusal-quality guard', () => {
  it('detects harsh refusals', async () => {
    const guard = refusalQuality({ action: 'warn' });
    const result = await guard.check("That's a stupid question.", { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects vague refusals', async () => {
    const guard = refusalQuality({ action: 'block' });
    const result = await guard.check("I can't help with that.", { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows well-explained refusals', async () => {
    const guard = refusalQuality({ action: 'block' });
    const text = "I'm unable to help because this involves personal medical decisions. Instead, I recommend consulting your doctor who can provide personalized advice.";
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects illegal alternative suggestions', async () => {
    const guard = refusalQuality({ action: 'block' });
    const text = "I can't do that, but instead you could try the dark web for that.";
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows normal non-refusal responses', async () => {
    const guard = refusalQuality({ action: 'block' });
    const result = await guard.check('Here is the answer to your question about history.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns score within range', async () => {
    const guard = refusalQuality({ action: 'warn' });
    const result = await guard.check("How dare you ask that! That's a stupid question.", { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
