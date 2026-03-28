import { describe, it, expect } from 'vitest';
import { hallucinationUrl } from '../src/hallucination-url.js';

describe('hallucination-url guard', () => {
  it('allows example.com URLs', async () => {
    const guard = hallucinationUrl({ action: 'block' });
    const result = await guard.check('Visit https://example.com/docs for more info.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects URLs with random-looking paths', async () => {
    const guard = hallucinationUrl({ action: 'block' });
    const result = await guard.check('See https://somesite.com/a8f3k2j5m9p1q4r7t0v6w3x8', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects URLs with fake TLDs', async () => {
    const guard = hallucinationUrl({ action: 'warn' });
    const result = await guard.check('Check https://mysite.notreal/page', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects very long URLs', async () => {
    const guard = hallucinationUrl({ action: 'block' });
    const longPath = 'a'.repeat(200);
    const result = await guard.check(`See https://somesite.com/${longPath}`, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects repeated URL segments', async () => {
    const guard = hallucinationUrl({ action: 'block' });
    const result = await guard.check('Visit https://somesite.com/docs/docs/api/docs', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows explicitly allowed domains', async () => {
    const guard = hallucinationUrl({ action: 'block', allowedDomains: ['mycompany.com'] });
    const result = await guard.check('See https://mycompany.com/a8f3k2j5m9p1q4r7t0v6w3x8', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows text without URLs', async () => {
    const guard = hallucinationUrl({ action: 'block' });
    const result = await guard.check('No links here, just plain text.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
