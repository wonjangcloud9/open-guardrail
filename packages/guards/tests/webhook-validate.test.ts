import { describe, it, expect } from 'vitest';
import { webhookValidate } from '../src/webhook-validate.js';
const ctx = { pipelineType: 'input' as const };
describe('webhook-validate', () => {
  it('flags missing HMAC signature', async () => {
    const g = webhookValidate({ action: 'block' });
    const r = await g.check('{"event":"push","data":{}}', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('missing_hmac_signature');
  });
  it('flags missing timestamp', async () => {
    const g = webhookValidate({ action: 'block' });
    const r = await g.check('x-hub-signature: sha256=abc123 body={}', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('missing_timestamp');
  });
  it('flags payload exceeding max size', async () => {
    const g = webhookValidate({ action: 'block', maxPayloadSize: 10 });
    const r = await g.check('x-hub-signature: sha256=abc x-timestamp: 123 ' + 'a'.repeat(20), ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toEqual(expect.arrayContaining([expect.stringContaining('payload_size_exceeded')]));
  });
  it('passes valid webhook with signature and timestamp', async () => {
    const now = Math.floor(Date.now() / 1000);
    const g = webhookValidate({ action: 'block' });
    const r = await g.check(`x-hub-signature: sha256=abc x-timestamp: fresh t=${now}`, ctx);
    expect(r.passed).toBe(true);
  });
  it('flags stale timestamp', async () => {
    const g = webhookValidate({ action: 'warn' });
    const r = await g.check('x-hub-signature: sha256=abc x-timestamp: ok t=1000000000', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('stale_timestamp');
  });
  it('has correct metadata', async () => {
    const g = webhookValidate({ action: 'block' });
    expect(g.name).toBe('webhook-validate');
    expect(g.category).toBe('security');
  });
});
