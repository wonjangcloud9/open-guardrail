import { describe, it, expect } from 'vitest';
import { emptyResponse } from '../src/empty-response.js';
const ctx = { pipelineType: 'output' as const };

describe('empty-response guard', () => {
  it('blocks empty text', async () => {
    const guard = emptyResponse({ action: 'block' });
    const result = await guard.check('', ctx);
    expect(result.passed).toBe(false);
  });
  it('blocks whitespace-only', async () => {
    const guard = emptyResponse({ action: 'block' });
    const result = await guard.check('   \n  ', ctx);
    expect(result.passed).toBe(false);
  });
  it('allows normal text', async () => {
    const guard = emptyResponse({ action: 'block' });
    const result = await guard.check('Here is a response', ctx);
    expect(result.passed).toBe(true);
  });
  it('enforces minimum length', async () => {
    const guard = emptyResponse({ action: 'block', minContentLength: 20 });
    const result = await guard.check('Short', ctx);
    expect(result.passed).toBe(false);
  });
});
