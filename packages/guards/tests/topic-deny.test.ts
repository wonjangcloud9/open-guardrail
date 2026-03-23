import { describe, it, expect } from 'vitest';
import { topicDeny } from '../src/topic-deny.js';

const ctx = { pipelineType: 'input' as const };

describe('topic-deny guard', () => {
  it('blocks text matching denied topic', async () => {
    const guard = topicDeny({
      topics: ['politics'],
      action: 'block',
    });
    const result = await guard.check(
      'The senator announced a new campaign today.',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
    expect(result.details?.matchedTopics).toContain('politics');
  });

  it('allows text unrelated to denied topics', async () => {
    const guard = topicDeny({
      topics: ['violence', 'drugs'],
      action: 'block',
    });
    const result = await guard.check(
      'The weather is sunny today.',
      ctx,
    );
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('supports custom topics', async () => {
    const guard = topicDeny({
      topics: ['crypto'],
      customTopics: {
        crypto: ['bitcoin', 'ethereum', 'blockchain'],
      },
      action: 'warn',
    });
    const result = await guard.check(
      'Should I invest in bitcoin?',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
    expect(result.details?.matchedTopics).toContain('crypto');
  });

  it('returns matched topics in details', async () => {
    const guard = topicDeny({
      topics: ['violence', 'weapons'],
      action: 'block',
    });
    const result = await guard.check(
      'The assault rifle was used in the shooting.',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.details?.matchedTopics).toContain('violence');
    expect(result.details?.matchedTopics).toContain('weapons');
  });
});
