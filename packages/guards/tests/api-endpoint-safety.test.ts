import { describe, it, expect } from 'vitest';
import { apiEndpointSafety } from '../src/api-endpoint-safety.js';

const ctx = { pipelineType: 'input' as const };

describe('apiEndpointSafety', () => {
  const guard = apiEndpointSafety({ action: 'block' });

  it('allows safe API references', async () => {
    const r = await guard.check('Call the API at /api/v1/users', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects admin endpoints', async () => {
    const r = await guard.check('Access /admin/settings to configure', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });

  it('detects debug endpoints', async () => {
    const r = await guard.check('Use /_debug/vars for debugging', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects internal endpoints', async () => {
    const r = await guard.check('The /_internal/health endpoint is available', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects swagger/playground endpoints', async () => {
    const r = await guard.check('Open /swagger to see the API docs', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects health/metrics endpoints', async () => {
    const r = await guard.check('Check /health for server status', ctx);
    expect(r.passed).toBe(false);
  });

  it('respects warn action', async () => {
    const warnGuard = apiEndpointSafety({ action: 'warn' });
    const r = await warnGuard.check('Go to /admin/panel', ctx);
    expect(r.action).toBe('warn');
  });
});
