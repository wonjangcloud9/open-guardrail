import { describe, it, expect } from 'vitest';
import { tokenLimit } from '../src/token-limit.js';

const ctx = { pipelineType: 'input' as const };

describe('token-limit guard', () => {
  it('allows text within token limit', async () => {
    const guard = tokenLimit({ action: 'block', maxTokens: 100 });
    const result = await guard.check('Hello world', ctx);
    expect(result.passed).toBe(true);
  });

  it('blocks text exceeding token limit', async () => {
    const guard = tokenLimit({ action: 'block', maxTokens: 5 });
    const words = Array(50).fill('longword').join(' ');
    const result = await guard.check(words, ctx);
    expect(result.passed).toBe(false);
  });

  it('returns estimated tokens in details', async () => {
    const guard = tokenLimit({ action: 'warn', maxTokens: 1000 });
    const result = await guard.check('Hello world test', ctx);
    expect(result.details?.estimatedTokens).toBeGreaterThan(0);
  });

  it('supports chars estimation method', async () => {
    const guard = tokenLimit({ action: 'block', maxTokens: 10, estimationMethod: 'chars' });
    const result = await guard.check('A'.repeat(100), ctx);
    expect(result.passed).toBe(false);
  });

  it('supports words estimation method', async () => {
    const guard = tokenLimit({ action: 'block', maxTokens: 5, estimationMethod: 'words' });
    const result = await guard.check('one two three four five six seven', ctx);
    expect(result.passed).toBe(false);
  });
});
