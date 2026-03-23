import { describe, it, expect, vi } from 'vitest';
import { groundedness } from '../src/groundedness.js';

const ctx = { pipelineType: 'output' as const };

describe('groundedness guard', () => {
  it('passes when grounded', async () => {
    const guard = groundedness({
      action: 'block',
      callLlm: vi.fn().mockResolvedValue(
        JSON.stringify({
          score: 0.95,
          reason: 'fully grounded',
        }),
      ),
      context: 'Paris is the capital of France.',
    });

    const r = await guard.check(
      'The capital of France is Paris.',
      ctx,
    );
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
    expect(r.score).toBe(0.95);
  });

  it('blocks when ungrounded', async () => {
    const guard = groundedness({
      action: 'block',
      callLlm: vi.fn().mockResolvedValue(
        JSON.stringify({
          score: 0.1,
          reason: 'not in context',
        }),
      ),
      context: 'Paris is the capital of France.',
    });

    const r = await guard.check(
      'Tokyo is the capital of France.',
      ctx,
    );
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });

  it('handles empty context', async () => {
    const guard = groundedness({
      action: 'warn',
      callLlm: vi.fn().mockResolvedValue(
        JSON.stringify({
          score: 0.0,
          reason: 'no context provided',
        }),
      ),
      context: '',
    });

    const r = await guard.check('anything', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
    expect(r.score).toBe(0.0);
  });

  it('respects custom threshold', async () => {
    const guard = groundedness({
      action: 'block',
      callLlm: vi.fn().mockResolvedValue(
        JSON.stringify({
          score: 0.6,
          reason: 'partially grounded',
        }),
      ),
      context: 'some context',
      threshold: 0.8,
    });

    const r = await guard.check('text', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.threshold).toBe(0.8);
  });

  it('handles callLlm throwing', async () => {
    const guard = groundedness({
      action: 'block',
      callLlm: vi
        .fn()
        .mockRejectedValue(new Error('fail')),
      context: 'ctx',
    });

    const r = await guard.check('text', ctx);
    expect(r.passed).toBe(false);
    expect(r.error?.code).toBe('EXCEPTION');
  });
});
