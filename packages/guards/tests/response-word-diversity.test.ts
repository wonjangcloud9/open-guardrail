import { describe, it, expect } from 'vitest';
import { responseWordDiversity } from '../src/response-word-diversity.js';

describe('response-word-diversity', () => {
  it('allows diverse text', async () => {
    const guard = responseWordDiversity({ action: 'block' });
    const result = await guard.check(
      'The quick brown fox jumps over the lazy dog near a stream.',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(true);
  });

  it('detects low word diversity', async () => {
    const guard = responseWordDiversity({ action: 'block', minDiversity: 0.5 });
    const result = await guard.check(
      'the the the the the the the the the the cat cat cat cat',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(false);
  });

  it('detects filler word overuse', async () => {
    const guard = responseWordDiversity({ action: 'warn' });
    const result = await guard.check(
      'Basically actually just really very basically just really very basically actually',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(false);
  });

  it('allows empty text', async () => {
    const guard = responseWordDiversity({ action: 'block' });
    const result = await guard.check('', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('uses default minDiversity of 0.3', async () => {
    const guard = responseWordDiversity({ action: 'block' });
    const result = await guard.check('Hello world foo bar baz', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
