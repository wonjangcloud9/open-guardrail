import { describe, it, expect, vi } from 'vitest';
import { hallucination } from '../src/hallucination.js';

const ctx = { pipelineType: 'output' as const };

describe('hallucination guard', () => {
  it('passes when claims are supported', async () => {
    const guard = hallucination({
      action: 'block',
      callLlm: vi.fn().mockResolvedValue(
        JSON.stringify({
          supported: true,
          unsupported_claims: [],
        }),
      ),
      sources: ['The sky is blue.'],
    });

    const r = await guard.check(
      'The sky is blue.',
      ctx,
    );
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
    expect(r.details?.supported).toBe(true);
  });

  it('blocks when claims are unsupported', async () => {
    const guard = hallucination({
      action: 'block',
      callLlm: vi.fn().mockResolvedValue(
        JSON.stringify({
          supported: false,
          unsupported_claims: [
            'The sky is green',
          ],
        }),
      ),
      sources: ['The sky is blue.'],
    });

    const r = await guard.check(
      'The sky is green.',
      ctx,
    );
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
    expect(r.details?.unsupportedClaims).toEqual([
      'The sky is green',
    ]);
  });

  it('handles malformed LLM response', async () => {
    const guard = hallucination({
      action: 'warn',
      callLlm: vi
        .fn()
        .mockResolvedValue('not json at all'),
      sources: ['source'],
    });

    const r = await guard.check('text', ctx);
    expect(r.passed).toBe(false);
    expect(r.error?.code).toBe('EXCEPTION');
  });

  it('handles callLlm throwing', async () => {
    const guard = hallucination({
      action: 'block',
      callLlm: vi
        .fn()
        .mockRejectedValue(new Error('net')),
      sources: ['source'],
    });

    const r = await guard.check('text', ctx);
    expect(r.passed).toBe(false);
    expect(r.error?.code).toBe('EXCEPTION');
  });
});
