import { describe, it, expect } from 'vitest';
import { contextWindowAbuse } from '../src/context-window-abuse.js';

describe('context-window-abuse guard', () => {
  it('detects excessive whitespace padding', async () => {
    const guard = contextWindowAbuse({ action: 'block' });
    const text = 'Do this: ' + ' '.repeat(500) + 'secret instruction';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects low unique character ratio', async () => {
    const guard = contextWindowAbuse({ action: 'block' });
    const text = 'aaaa'.repeat(500);
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects repeated blocks', async () => {
    const guard = contextWindowAbuse({ action: 'warn' });
    const block = 'This is a repeated block of text used for padding.  ';
    const text = block.repeat(20);
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal input', async () => {
    const guard = contextWindowAbuse({ action: 'block' });
    const result = await guard.check('What is the capital of France? Please explain in detail.', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('handles empty input', async () => {
    const guard = contextWindowAbuse({ action: 'block' });
    const result = await guard.check('', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('respects custom maxPaddingRatio', async () => {
    const guard = contextWindowAbuse({ action: 'block', maxPaddingRatio: 0.8 });
    const text = 'Do this: ' + ' '.repeat(100) + 'instruction here with enough content';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns details with ratios', async () => {
    const guard = contextWindowAbuse({ action: 'block' });
    const text = ' '.repeat(800) + 'aa';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.details).toBeDefined();
  });
});
