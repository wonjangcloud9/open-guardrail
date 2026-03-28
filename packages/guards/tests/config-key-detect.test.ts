import { describe, it, expect } from 'vitest';
import { configKeyDetect } from '../src/config-key-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('configKeyDetect', () => {
  const guard = configKeyDetect({ action: 'block' });

  it('allows normal text', async () => {
    const r = await guard.check('Configure the application using environment variables.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects connection_string', async () => {
    const r = await guard.check('connection_string = "Server=mydb;Database=prod"', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects database_url', async () => {
    const r = await guard.check('database_url: postgres://admin:pass@db:5432/prod', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects redis_url', async () => {
    const r = await guard.check('redis_url=redis://localhost:6379/0', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects smtp credentials', async () => {
    const r = await guard.check('smtp_password = "my_secret_pass"', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects config.get with secret', async () => {
    const r = await guard.check('config.get("secret_key")', ctx);
    expect(r.passed).toBe(false);
  });

  it('respects warn action', async () => {
    const warnGuard = configKeyDetect({ action: 'warn' });
    const r = await warnGuard.check('DB_PASSWORD = "hunter2"', ctx);
    expect(r.action).toBe('warn');
  });
});
