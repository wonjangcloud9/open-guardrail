import { describe, it, expect } from 'vitest';
import { responseSafetyNet } from '../src/response-safety-net.js';

describe('response-safety-net guard', () => {
  it('detects empty response', async () => {
    const guard = responseSafetyNet({ action: 'block' });
    const result = await guard.check('', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects raw HTML script tags', async () => {
    const guard = responseSafetyNet({ action: 'block' });
    const result = await guard.check('Hello <script>alert("xss")</script>', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects control characters', async () => {
    const guard = responseSafetyNet({ action: 'block' });
    const result = await guard.check('Normal text\x01hidden', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes normal text', async () => {
    const guard = responseSafetyNet({ action: 'block' });
    const result = await guard.check('This is a perfectly normal response with useful information.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects iframe tags', async () => {
    const guard = responseSafetyNet({ action: 'warn' });
    const result = await guard.check('Check this: <iframe src="evil.com"></iframe>', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns score proportional to issues', async () => {
    const guard = responseSafetyNet({ action: 'block' });
    const result = await guard.check('', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
