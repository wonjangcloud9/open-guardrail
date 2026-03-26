import { describe, it, expect } from 'vitest';
import { validChoice } from '../src/valid-choice.js';

const ctx = { pipelineType: 'output' as const };

describe('valid-choice guard', () => {
  it('allows valid choice', async () => {
    const guard = validChoice({ action: 'block', choices: ['yes', 'no', 'maybe'] });
    const result = await guard.check('yes', ctx);
    expect(result.passed).toBe(true);
  });

  it('blocks invalid choice', async () => {
    const guard = validChoice({ action: 'block', choices: ['yes', 'no'] });
    const result = await guard.check('perhaps', ctx);
    expect(result.passed).toBe(false);
  });

  it('case-insensitive by default', async () => {
    const guard = validChoice({ action: 'block', choices: ['Yes', 'No'] });
    const result = await guard.check('YES', ctx);
    expect(result.passed).toBe(true);
  });

  it('case-sensitive when configured', async () => {
    const guard = validChoice({ action: 'block', choices: ['Yes'], caseSensitive: true });
    const result = await guard.check('yes', ctx);
    expect(result.passed).toBe(false);
  });

  it('trims whitespace by default', async () => {
    const guard = validChoice({ action: 'block', choices: ['yes'] });
    const result = await guard.check('  yes  ', ctx);
    expect(result.passed).toBe(true);
  });

  it('shows allowed choices in details', async () => {
    const guard = validChoice({ action: 'warn', choices: ['A', 'B', 'C'] });
    const result = await guard.check('D', ctx);
    expect(result.details?.allowedChoices).toEqual(['A', 'B', 'C']);
  });
});
