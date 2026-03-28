import { describe, it, expect } from 'vitest';
import { authTokenDetect } from '../src/auth-token-detect.js';

describe('auth-token-detect guard', () => {
  it('detects Bearer token', async () => {
    const guard = authTokenDetect({ action: 'block' });
    const result = await guard.check('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects JWT format', async () => {
    const guard = authTokenDetect({ action: 'block' });
    const result = await guard.check('token: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects PHPSESSID', async () => {
    const guard = authTokenDetect({ action: 'warn' });
    const result = await guard.check('PHPSESSID=abc123def456', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects JSESSIONID', async () => {
    const guard = authTokenDetect({ action: 'block' });
    const result = await guard.check('Cookie: JSESSIONID=ABCD1234', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects refresh token', async () => {
    const guard = authTokenDetect({ action: 'block' });
    const result = await guard.check('refresh_token=abc123xyz', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = authTokenDetect({ action: 'block' });
    const result = await guard.check('What is authentication?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('returns score based on matches', async () => {
    const guard = authTokenDetect({ action: 'block' });
    const result = await guard.check('Bearer abc123 access_token=xyz refresh_token=def', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
