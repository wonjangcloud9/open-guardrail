import { describe, it, expect } from 'vitest';
import { bias } from '../src/bias.js';

const ctx = { pipelineType: 'input' as const };

describe('bias guard', () => {
  it('detects gender bias patterns', async () => {
    const guard = bias({ action: 'block' });
    const result = await guard.check(
      'Women belong in the kitchen, not the office.',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
    expect(result.details?.matchedCategories).toHaveProperty('gender');
  });

  it('detects racial bias', async () => {
    const guard = bias({ action: 'warn' });
    const result = await guard.check(
      'All asians are good at math.',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
    expect(result.details?.matchedCategories).toHaveProperty('racial');
  });

  it('allows neutral text', async () => {
    const guard = bias({ action: 'block' });
    const result = await guard.check(
      'The project deadline is next Friday.',
      ctx,
    );
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('returns category in details', async () => {
    const guard = bias({
      categories: ['age'],
      action: 'warn',
    });
    const result = await guard.check(
      'Old people can\'t use computers.',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.details?.matchedCategories).toHaveProperty('age');
  });
});
