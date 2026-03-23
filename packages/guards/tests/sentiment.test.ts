import { describe, it, expect } from 'vitest';
import { sentiment } from '../src/sentiment.js';

describe('sentiment', () => {
  it('detects aggressive tone', async () => {
    const guard = sentiment({
      action: 'block',
      blocked: ['aggressive'],
    });
    const result = await guard.check(
      'I will destroy and annihilate everything',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects negative tone', async () => {
    const guard = sentiment({
      action: 'warn',
      blocked: ['negative'],
    });
    const result = await guard.check(
      'This is terrible, horrible, and awful',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('allows neutral text', async () => {
    const guard = sentiment({
      action: 'block',
      blocked: ['aggressive', 'negative', 'fearful'],
    });
    const result = await guard.check(
      'The quarterly report shows steady growth in revenue.',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('respects threshold setting', async () => {
    const guard = sentiment({
      action: 'block',
      blocked: ['negative'],
      threshold: 0.9,
    });
    const result = await guard.check(
      'This is terrible but otherwise a fine day with nice weather and good food',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(true);
  });
});
