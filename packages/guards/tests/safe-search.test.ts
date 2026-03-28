import { describe, it, expect } from 'vitest';
import { safeSearch } from '../src/safe-search.js';

describe('safe-search guard', () => {
  it('allows safe queries', async () => {
    const guard = safeSearch({ action: 'block' });
    const result = await guard.check('best restaurants near me', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('blocks explicit content queries', async () => {
    const guard = safeSearch({ action: 'block' });
    const result = await guard.check('porn videos free', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('blocks drug-related queries', async () => {
    const guard = safeSearch({ action: 'block' });
    const result = await guard.check('how to make meth at home', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('blocks violence queries', async () => {
    const guard = safeSearch({ action: 'block' });
    const result = await guard.check('how to kill someone', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('strict mode catches borderline content', async () => {
    const guard = safeSearch({ action: 'warn', strictMode: true });
    const result = await guard.check('hot girls bikini photos', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('non-strict mode allows borderline content', async () => {
    const guard = safeSearch({ action: 'block', strictMode: false });
    const result = await guard.check('bikini fashion trends', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns matched pattern count', async () => {
    const guard = safeSearch({ action: 'block' });
    const result = await guard.check('nsfw porn xxx', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect(result.details!.matchedPatterns).toBeGreaterThan(0);
  });
});
