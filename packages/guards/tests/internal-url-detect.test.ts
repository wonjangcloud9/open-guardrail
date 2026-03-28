import { describe, it, expect } from 'vitest';
import { internalUrlDetect } from '../src/internal-url-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('internalUrlDetect', () => {
  const guard = internalUrlDetect({ action: 'block' });

  it('allows public URLs', async () => {
    const r = await guard.check('Visit https://example.com for more info.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects localhost', async () => {
    const r = await guard.check('Running at http://localhost:3000', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects 127.0.0.1', async () => {
    const r = await guard.check('API at http://127.0.0.1:8080/api', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects 10.x.x.x private IP', async () => {
    const r = await guard.check('Server: http://10.0.1.50:9200', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects 192.168.x.x private IP', async () => {
    const r = await guard.check('Access http://192.168.1.100/admin', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects .internal domain', async () => {
    const r = await guard.check('Use https://api.internal for requests', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects .corp domain', async () => {
    const r = await guard.check('Wiki at https://wiki.corp', ctx);
    expect(r.passed).toBe(false);
  });
});
