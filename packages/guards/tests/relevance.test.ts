import { describe, it, expect, vi } from 'vitest';
import { relevance } from '../src/relevance.js';

const ctx = { pipelineType: 'output' as const };

describe('relevance guard', () => {
  it('passes when score above threshold', async () => {
    const guard = relevance({
      action: 'block',
      callLlm: vi.fn().mockResolvedValue(
        JSON.stringify({
          score: 0.9,
          reason: 'highly relevant',
        }),
      ),
      originalPrompt: 'What is TypeScript?',
    });

    const r = await guard.check(
      'TypeScript is a typed superset of JS.',
      ctx,
    );
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
    expect(r.score).toBe(0.9);
  });

  it('blocks when score below threshold', async () => {
    const guard = relevance({
      action: 'block',
      callLlm: vi.fn().mockResolvedValue(
        JSON.stringify({
          score: 0.2,
          reason: 'off topic',
        }),
      ),
      originalPrompt: 'What is TypeScript?',
    });

    const r = await guard.check(
      'I like pizza.',
      ctx,
    );
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
    expect(r.score).toBe(0.2);
  });

  it('respects custom threshold', async () => {
    const guard = relevance({
      action: 'warn',
      callLlm: vi.fn().mockResolvedValue(
        JSON.stringify({
          score: 0.6,
          reason: 'somewhat relevant',
        }),
      ),
      originalPrompt: 'question',
      threshold: 0.8,
    });

    const r = await guard.check('answer', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
    expect(r.details?.threshold).toBe(0.8);
  });

  it('handles malformed LLM response', async () => {
    const guard = relevance({
      action: 'block',
      callLlm: vi
        .fn()
        .mockResolvedValue('gibberish'),
      originalPrompt: 'q',
    });

    const r = await guard.check('a', ctx);
    expect(r.passed).toBe(false);
    expect(r.error?.code).toBe('EXCEPTION');
  });
});
