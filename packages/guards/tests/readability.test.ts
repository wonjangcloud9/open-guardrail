import { describe, it, expect } from 'vitest';
import { readability } from '../src/readability.js';

const ctx = { pipelineType: 'output' as const };

describe('readability guard', () => {
  it('scores simple text as easy', async () => {
    const guard = readability({ action: 'warn', minScore: 60 });
    const result = await guard.check('The cat sat on the mat. It was a good day.', ctx);
    expect(result.passed).toBe(true);
    expect(result.details?.grade).toBeDefined();
  });

  it('blocks text below minimum score', async () => {
    const guard = readability({ action: 'block', minScore: 90 });
    const result = await guard.check(
      'The epistemological ramifications of post-structuralist deconstruction necessitate a comprehensive reconsideration of ontological presuppositions.',
      ctx,
    );
    expect(result.passed).toBe(false);
  });

  it('returns Flesch score in details', async () => {
    const guard = readability({ action: 'warn' });
    const result = await guard.check('Hello. This is simple.', ctx);
    expect(result.details?.fleschScore).toBeDefined();
    expect(typeof result.details?.fleschScore).toBe('number');
  });

  it('handles empty-ish text gracefully', async () => {
    const guard = readability({ action: 'block', minScore: 0 });
    const result = await guard.check('', ctx);
    expect(result.passed).toBe(true);
  });
});
