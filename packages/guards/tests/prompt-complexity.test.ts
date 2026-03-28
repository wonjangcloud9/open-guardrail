import { describe, it, expect } from 'vitest';
import { promptComplexity } from '../src/prompt-complexity.js';

describe('prompt-complexity guard', () => {
  it('allows simple prompts', async () => {
    const guard = promptComplexity({ action: 'block' });
    const result = await guard.check('What is the weather today?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('detects deeply nested brackets', async () => {
    const guard = promptComplexity({ action: 'block', maxComplexityScore: 0.2 });
    const nested = '((((((((((deep nesting))))))))))';
    const result = await guard.check(nested, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects excessive special characters', async () => {
    const guard = promptComplexity({ action: 'warn', maxComplexityScore: 0.15 });
    const result = await guard.check('!@#$%^&*(){}[]<>!@#$%^&*()', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects mixed scripts', async () => {
    const guard = promptComplexity({ action: 'block', maxComplexityScore: 0.1 });
    const result = await guard.check('Hello Привет 你好', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('respects custom threshold', async () => {
    const guard = promptComplexity({ action: 'block', maxComplexityScore: 0.99 });
    const result = await guard.check('Some ((moderately)) complex {text}!', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns a numeric score', async () => {
    const guard = promptComplexity({ action: 'block' });
    const result = await guard.check('Test prompt', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
