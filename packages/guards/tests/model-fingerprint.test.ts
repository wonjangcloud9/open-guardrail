import { describe, it, expect } from 'vitest';
import { modelFingerprint } from '../src/model-fingerprint.js';

describe('model-fingerprint guard', () => {
  it('passes clean text', async () => {
    const guard = modelFingerprint({ action: 'block' });
    const r = await guard.check('The answer is 42', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
  it('blocks model identity leak', async () => {
    const guard = modelFingerprint({ action: 'block' });
    const r = await guard.check('I am an AI language model trained by OpenAI', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
