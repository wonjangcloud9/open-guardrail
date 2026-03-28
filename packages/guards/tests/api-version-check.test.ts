import { describe, it, expect } from 'vitest';
import { apiVersionCheck } from '../src/api-version-check.js';

const ctx = { pipelineType: 'output' as const };

describe('api-version-check guard', () => {
  it('detects deprecated api/v1 reference', async () => {
    const guard = apiVersionCheck({ action: 'block' });
    const result = await guard.check('Use api/v1/users endpoint', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects deprecated version string', async () => {
    const guard = apiVersionCheck({ action: 'block' });
    const result = await guard.check('version: "1" is still supported', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects deprecated keyword with api', async () => {
    const guard = apiVersionCheck({ action: 'warn' });
    const result = await guard.check('This deprecated api should not be used', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects old api-version date', async () => {
    const guard = apiVersionCheck({ action: 'block' });
    const result = await guard.check('api-version=2019-01-01', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects old sdk version', async () => {
    const guard = apiVersionCheck({ action: 'block' });
    const result = await guard.check('Install sdk-v2.3 for compatibility', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows current api references', async () => {
    const guard = apiVersionCheck({ action: 'block' });
    const result = await guard.check('Use api/v3/users for the latest', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows clean text without api mentions', async () => {
    const guard = apiVersionCheck({ action: 'block' });
    const result = await guard.check('Hello world', ctx);
    expect(result.passed).toBe(true);
  });
});
