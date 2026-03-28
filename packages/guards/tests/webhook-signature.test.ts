import { describe, it, expect } from 'vitest';
import { webhookSignature } from '../src/webhook-signature.js';

describe('webhook-signature guard', () => {
  it('detects missing hub signature in webhook request', async () => {
    const guard = webhookSignature({ action: 'block' });
    const result = await guard.check('webhook payload without signature headers', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('passes when signature headers are present', async () => {
    const guard = webhookSignature({ action: 'block' });
    const result = await guard.check('x-hub-signature: sha256=abc x-webhook-signature: def', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects old timestamp', async () => {
    const guard = webhookSignature({ action: 'warn', maxAgeMs: 1000 });
    const oldTs = Date.now() - 50000;
    const result = await guard.check(`webhook timestamp=${oldTs}`, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('allows recent timestamp', async () => {
    const guard = webhookSignature({ action: 'block' });
    const recentTs = Date.now() - 1000;
    const result = await guard.check(`x-hub-signature: sha256=abc x-webhook-signature: def timestamp=${recentTs}`, { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects duplicate delivery IDs (replay)', async () => {
    const guard = webhookSignature({ action: 'block' });
    const result = await guard.check('x-delivery-id: abc123 some data x-delivery-id: abc123', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('returns score proportional to issues', async () => {
    const guard = webhookSignature({ action: 'block' });
    const result = await guard.check('webhook payload no signatures', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('allows normal non-webhook text', async () => {
    const guard = webhookSignature({ action: 'block' });
    const result = await guard.check('Hello, how are you today?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
