import { describe, it, expect } from 'vitest';
import { readingTime } from '../src/reading-time.js';

const ctx = { pipelineType: 'output' as const };

describe('reading-time guard', () => {
  it('allows short text', async () => {
    const guard = readingTime({ action: 'block', maxMinutes: 1 });
    const result = await guard.check('Hello world.', ctx);
    expect(result.passed).toBe(true);
    expect(result.details?.estimatedMinutes).toBeLessThan(1);
  });

  it('blocks text exceeding max reading time', async () => {
    const guard = readingTime({ action: 'block', maxMinutes: 0.01 });
    const words = Array(100).fill('word').join(' ');
    const result = await guard.check(words, ctx);
    expect(result.passed).toBe(false);
  });

  it('respects custom WPM', async () => {
    const guard = readingTime({ action: 'warn', maxMinutes: 1, wordsPerMinute: 50 });
    const words = Array(60).fill('word').join(' ');
    const result = await guard.check(words, ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.estimatedMinutes).toBeGreaterThan(1);
  });

  it('returns word count in details', async () => {
    const guard = readingTime({ action: 'warn', maxMinutes: 10 });
    const result = await guard.check('one two three four five', ctx);
    expect(result.details?.wordCount).toBe(5);
  });
});
