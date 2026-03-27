import { describe, it, expect } from 'vitest';
import { redirectDetect } from '../src/redirect-detect.js';

describe('redirect-detect guard', () => {
  it('passes clean text', async () => {
    const guard = redirectDetect({ action: 'block' });
    const r = await guard.check('The answer is 42', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });
  it('blocks redirect attempt', async () => {
    const guard = redirectDetect({ action: 'block' });
    const r = await guard.check('window.location = "https://evil.com"', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });
});
