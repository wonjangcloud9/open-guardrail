import { describe, it, expect } from 'vitest';
import { versionInfoDetect } from '../src/version-info-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('versionInfoDetect', () => {
  const guard = versionInfoDetect({ action: 'block' });

  it('allows text without version info', async () => {
    const r = await guard.check('The server is running and healthy.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects Apache version', async () => {
    const r = await guard.check('Server: Apache/2.4.52', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects nginx version', async () => {
    const r = await guard.check('nginx/1.21.6 is running', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects PHP version', async () => {
    const r = await guard.check('X-Powered-By: PHP/8.1.2', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Node.js version', async () => {
    const r = await guard.check('Running Node.js/v18.12.0', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Express version', async () => {
    const r = await guard.check('Framework: Express/4.18', ctx);
    expect(r.passed).toBe(false);
  });

  it('respects warn action', async () => {
    const warnGuard = versionInfoDetect({ action: 'warn' });
    const r = await warnGuard.check('Apache/2.4.52', ctx);
    expect(r.action).toBe('warn');
  });
});
