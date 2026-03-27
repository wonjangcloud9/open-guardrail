import { describe, it, expect } from 'vitest';
import { responseCachingSafe } from '../src/response-caching-safe.js';

const ctx = { pipelineType: 'output' as const };

describe('response-caching-safe guard', () => {
  it('detects user-specific data', async () => {
    const guard = responseCachingSafe({ action: 'warn' });
    const result = await guard.check('Your account balance is $500.', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.reasons).toContain('user-specific');
  });

  it('allows generic cacheable content', async () => {
    const guard = responseCachingSafe({ action: 'block' });
    const result = await guard.check('Python is a general-purpose programming language.', ctx);
    expect(result.passed).toBe(true);
  });
});
