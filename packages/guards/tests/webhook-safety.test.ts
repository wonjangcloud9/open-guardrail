import { describe, it, expect } from 'vitest';
import { webhookSafety } from '../src/webhook-safety.js';

describe('webhook-safety guard', () => {
  it('passes clean text', async () => {
    const guard = webhookSafety({ action: 'block' });
    const r = await guard.check('Hello', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });
  it('blocks webhook URL', async () => {
    const guard = webhookSafety({ action: 'block' });
    const r = await guard.check('POST https://evil.com/webhook', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });
});
