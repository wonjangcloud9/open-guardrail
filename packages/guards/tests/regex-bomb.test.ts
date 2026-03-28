import { describe, it, expect } from 'vitest';
import { regexBomb } from '../src/regex-bomb.js';

describe('regex-bomb guard', () => {
  it('detects nested quantifiers (a+)+', async () => {
    const guard = regexBomb({ action: 'block' });
    const result = await guard.check('Use regex (a+)+ to match', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects (.+)+ pattern', async () => {
    const guard = regexBomb({ action: 'block' });
    const result = await guard.check('Pattern: (.+)+$', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects (.*)+', async () => {
    const guard = regexBomb({ action: 'block' });
    const result = await guard.check('Try (.*)+', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects (a*)*', async () => {
    const guard = regexBomb({ action: 'warn' });
    const result = await guard.check('The pattern (a*)* is bad', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('allows safe regex patterns', async () => {
    const guard = regexBomb({ action: 'block' });
    const result = await guard.check('Use [a-z]+ for matching', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows normal text without regex', async () => {
    const guard = regexBomb({ action: 'block' });
    const result = await guard.check('Hello world, how are you?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
