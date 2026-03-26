import { describe, it, expect } from 'vitest';
import { banSubstring } from '../src/ban-substring.js';

const ctx = { pipelineType: 'input' as const };

describe('ban-substring guard', () => {
  it('blocks banned substring', async () => {
    const guard = banSubstring({ action: 'block', substrings: ['forbidden', 'banned'] });
    const result = await guard.check('This contains a forbidden word', ctx);
    expect(result.passed).toBe(false);
  });

  it('case-insensitive by default', async () => {
    const guard = banSubstring({ action: 'block', substrings: ['SECRET'] });
    const result = await guard.check('this is a secret message', ctx);
    expect(result.passed).toBe(false);
  });

  it('case-sensitive when configured', async () => {
    const guard = banSubstring({ action: 'block', substrings: ['SECRET'], caseSensitive: true });
    const result = await guard.check('this is a secret message', ctx);
    expect(result.passed).toBe(true);
  });

  it('containsAll requires all substrings', async () => {
    const guard = banSubstring({ action: 'block', substrings: ['foo', 'bar'], containsAll: true });
    const result1 = await guard.check('only foo here', ctx);
    expect(result1.passed).toBe(true);
    const result2 = await guard.check('foo and bar together', ctx);
    expect(result2.passed).toBe(false);
  });

  it('allows clean text', async () => {
    const guard = banSubstring({ action: 'block', substrings: ['banned'] });
    const result = await guard.check('Everything is fine', ctx);
    expect(result.passed).toBe(true);
  });
});
