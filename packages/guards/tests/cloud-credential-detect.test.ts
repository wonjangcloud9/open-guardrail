import { describe, it, expect } from 'vitest';
import { cloudCredentialDetect } from '../src/cloud-credential-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('cloudCredentialDetect', () => {
  const guard = cloudCredentialDetect({ action: 'block' });

  it('allows text without credentials', async () => {
    const r = await guard.check('AWS provides many cloud services.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects AWS access key', async () => {
    const r = await guard.check('Key: AKIAIOSFODNN7EXAMPLE', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });

  it('detects AWS secret key', async () => {
    const r = await guard.check('aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY01', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects GCP service account JSON', async () => {
    const r = await guard.check('{"type": "service_account", "project_id": "my-project"}', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Azure connection string', async () => {
    const r = await guard.check('DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=abc123', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects DigitalOcean token', async () => {
    const r = await guard.check('Token: dop_v1_' + 'a'.repeat(64), ctx);
    expect(r.passed).toBe(false);
  });

  it('respects warn action', async () => {
    const warnGuard = cloudCredentialDetect({ action: 'warn' });
    const r = await warnGuard.check('AKIAIOSFODNN7EXAMPLE', ctx);
    expect(r.action).toBe('warn');
  });
});
