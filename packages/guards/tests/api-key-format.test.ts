import { describe, it, expect } from 'vitest';
import { apiKeyFormat } from '../src/api-key-format.js';

describe('api-key-format guard', () => {
  it('detects all-zeros fake key', async () => {
    const guard = apiKeyFormat({ action: 'block' });
    const result = await guard.check('0000000000000000000000', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects test/demo prefix', async () => {
    const guard = apiKeyFormat({ action: 'block' });
    const result = await guard.check('test_key_12345', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects too-short key', async () => {
    const guard = apiKeyFormat({ action: 'block' });
    const result = await guard.check('abc', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('passes valid-looking key', async () => {
    const guard = apiKeyFormat({ action: 'block' });
    const result = await guard.check('sk-abcdef1234567890abcdef1234567890abcdef12345678', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects invalid characters', async () => {
    const guard = apiKeyFormat({ action: 'block' });
    const result = await guard.check('key with spaces and $pecial', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('returns score between 0 and 1', async () => {
    const guard = apiKeyFormat({ action: 'block' });
    const result = await guard.check('demo_fake_key', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
