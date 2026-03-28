import { describe, it, expect } from 'vitest';
import { responseCachePoison } from '../src/response-cache-poison.js';

describe('response-cache-poison guard', () => {
  it('detects set-cookie in cacheable response', async () => {
    const guard = responseCachePoison({ action: 'block' });
    const result = await guard.check('cache-control: public\nset-cookie: session=abc', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects vary header abuse', async () => {
    const guard = responseCachePoison({ action: 'block' });
    const result = await guard.check('vary: *', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects stale-while-revalidate abuse', async () => {
    const guard = responseCachePoison({ action: 'warn' });
    const result = await guard.check('stale-while-revalidate=99999999', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects poisoned header patterns', async () => {
    const guard = responseCachePoison({ action: 'block' });
    const result = await guard.check('x-original-url: /admin', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows clean response', async () => {
    const guard = responseCachePoison({ action: 'block' });
    const result = await guard.check('HTTP/1.1 200 OK\ncache-control: private\ncontent-type: application/json', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns score', async () => {
    const guard = responseCachePoison({ action: 'block' });
    const result = await guard.check('vary: * x-original-url: /test', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
  });
});
