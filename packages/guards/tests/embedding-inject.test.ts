import { describe, it, expect } from 'vitest';
import { embeddingInject } from '../src/embedding-inject.js';

describe('embedding-inject', () => {
  const guard = embeddingInject({ action: 'block' });
  const ctx = { pipelineType: 'input' as const };

  it('passes normal query', async () => {
    const r = await guard.check('Normal query about AI', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('blocks repeated tokens', async () => {
    const spam = Array(60).fill('token').join(' ');
    const r = await guard.check(spam, ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });
});
