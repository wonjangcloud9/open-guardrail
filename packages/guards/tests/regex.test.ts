import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex.js';

describe('regex guard', () => {
  it('blocks text matching denied pattern', async () => {
    const guard = regex({ patterns: [/\bpassword\b/i], action: 'block' });
    const result = await guard.check('my password is 1234', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('allows text not matching any pattern', async () => {
    const guard = regex({ patterns: [/\bpassword\b/i], action: 'block' });
    const result = await guard.check('hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('rejects unsafe regex patterns (ReDoS)', () => {
    expect(() => regex({ patterns: [/(a+)+$/], action: 'block' }))
      .toThrow(/unsafe regex/i);
  });

  it('includes match details in result', async () => {
    const guard = regex({ patterns: [/\d{3}-\d{4}/], action: 'warn' });
    const result = await guard.check('call 123-4567', { pipelineType: 'input' });
    expect(result.details?.matches).toBeDefined();
  });
});
