import { describe, it, expect } from 'vitest';
import { reasoningTraceLeak } from '../src/reasoning-trace-leak.js';

describe('reasoning-trace-leak guard', () => {
  it('detects <thinking> tags in output', async () => {
    const guard = reasoningTraceLeak({ action: 'block' });
    const result = await guard.check('<thinking>I need to figure this out</thinking>', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects <scratchpad> tags', async () => {
    const guard = reasoningTraceLeak({ action: 'warn' });
    const result = await guard.check('<scratchpad>Let me plan this</scratchpad>', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects "Let me think step by step"', async () => {
    const guard = reasoningTraceLeak({ action: 'block' });
    const result = await guard.check('Let me think step by step about this problem.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects "Note to self:" pattern', async () => {
    const guard = reasoningTraceLeak({ action: 'block' });
    const result = await guard.check('Note to self: remember to check the data first.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows clean output', async () => {
    const guard = reasoningTraceLeak({ action: 'block' });
    const result = await guard.check('The capital of France is Paris.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('detects custom tags', async () => {
    const guard = reasoningTraceLeak({ action: 'block', customTags: ['reasoning'] });
    const result = await guard.check('<reasoning>planning steps</reasoning>', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns score proportional to matches', async () => {
    const guard = reasoningTraceLeak({ action: 'block' });
    const result = await guard.check('<thinking>Internal reasoning: Step 1: do it</thinking>', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
