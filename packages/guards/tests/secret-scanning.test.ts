import { describe, it, expect } from 'vitest';
import { secretScanning } from '../src/secret-scanning.js';

describe('secret-scanning', () => {
  const guard = secretScanning({ action: 'block' });
  const ctx = { pipelineType: 'input' as const };

  it('passes clean text', async () => {
    const r = await guard.check(
      'Hello, this is a normal message',
      ctx,
    );
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('blocks AWS access key', async () => {
    const r = await guard.check(
      'My key is AKIAIOSFODNN7EXAMPLE',
      ctx,
    );
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
    expect(r.details?.secretTypes).toContain('aws_access_key');
  });
});
