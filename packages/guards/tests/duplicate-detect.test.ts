import { describe, it, expect } from 'vitest';
import { duplicateDetect } from '../src/duplicate-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('duplicate-detect guard', () => {
  it('detects repeated sentences', async () => {
    const guard = duplicateDetect({ action: 'warn' });
    const text = 'This is a test sentence. This is a test sentence. Something else here.';
    const result = await guard.check(text, ctx);
    expect(result.passed).toBe(false);
  });

  it('allows unique content', async () => {
    const guard = duplicateDetect({ action: 'block' });
    const result = await guard.check('First point. Second point. Third point.', ctx);
    expect(result.passed).toBe(true);
  });

  it('returns duplicate ratio', async () => {
    const guard = duplicateDetect({ action: 'warn' });
    const text = 'Repeated sentence here. Repeated sentence here. Another one.';
    const result = await guard.check(text, ctx);
    expect(result.score).toBeGreaterThan(0);
  });
});
