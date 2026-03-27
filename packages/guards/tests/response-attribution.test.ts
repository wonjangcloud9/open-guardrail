import { describe, it, expect } from 'vitest';
import { responseAttribution } from '../src/response-attribution.js';

describe('response-attribution', () => {
  const guard = responseAttribution({
    action: 'block',
    requireAttribution: true,
  });
  const ctx = { pipelineType: 'output' as const };

  it('passes with citations', async () => {
    const r = await guard.check(
      'Studies show that AI improves productivity [1]',
      ctx,
    );
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('blocks without citations', async () => {
    const r = await guard.check(
      'Studies show that AI improves productivity significantly',
      ctx,
    );
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });
});
