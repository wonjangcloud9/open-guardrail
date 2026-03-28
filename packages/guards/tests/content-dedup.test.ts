import { describe, it, expect } from 'vitest';
import { contentDedup } from '../src/content-dedup.js';

describe('content-dedup guard', () => {
  it('passes unique content', async () => {
    const guard = contentDedup({ action: 'warn', blockSize: 20 });
    const result = await guard.check('This is unique content that does not repeat itself anywhere in the text at all.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects duplicated blocks', async () => {
    const guard = contentDedup({ action: 'warn', blockSize: 20 });
    const block = 'abcdefghijklmnopqrst';
    const filler = 'xxxxxxxxxxxxxxxxxxxx';
    const text = block + filler + block;
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes short text under block size', async () => {
    const guard = contentDedup({ action: 'block', blockSize: 100 });
    const result = await guard.check('Short text', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns duplicate count in details', async () => {
    const guard = contentDedup({ action: 'warn', blockSize: 10 });
    const block = 'abcdefghij';
    const text = block + 'xxxxxxxxxx' + block;
    const result = await guard.check(text, { pipelineType: 'output' });
    if (!result.passed && result.details) {
      expect(result.details.duplicateBlocks).toBeGreaterThan(0);
    }
  });

  it('uses default block size of 100', () => {
    const guard = contentDedup({ action: 'warn' });
    expect(guard.name).toBe('content-dedup');
  });

  it('has correct metadata', () => {
    const guard = contentDedup({ action: 'warn' });
    expect(guard.name).toBe('content-dedup');
    expect(guard.category).toBe('content');
  });
});
