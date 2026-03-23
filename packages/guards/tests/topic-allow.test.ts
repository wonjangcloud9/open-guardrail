import { describe, it, expect } from 'vitest';
import { topicAllow } from '../src/topic-allow.js';

const ctx = { pipelineType: 'input' as const };

describe('topic-allow guard', () => {
  it('allows text matching an allowed topic', async () => {
    const guard = topicAllow({
      topics: ['politics'],
      action: 'block',
    });
    const result = await guard.check(
      'The election results are in.',
      ctx,
    );
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
    expect(result.details?.matchedTopics).toContain('politics');
  });

  it('blocks text unrelated to allowed topics', async () => {
    const guard = topicAllow({
      topics: ['politics'],
      action: 'block',
    });
    const result = await guard.check(
      'The weather is sunny today.',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('supports custom topics', async () => {
    const guard = topicAllow({
      topics: ['cooking'],
      customTopics: {
        cooking: ['recipe', 'ingredient', 'bake', 'fry'],
      },
      action: 'warn',
    });
    const result = await guard.check(
      'Here is a great recipe for cake.',
      ctx,
    );
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
    expect(result.details?.matchedTopics).toContain('cooking');
  });
});
