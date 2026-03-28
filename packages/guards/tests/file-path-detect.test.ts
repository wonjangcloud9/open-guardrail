import { describe, it, expect } from 'vitest';
import { filePathDetect } from '../src/file-path-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('filePathDetect', () => {
  const guard = filePathDetect({ action: 'block' });

  it('allows text without file paths', async () => {
    const r = await guard.check('Store the file in the uploads directory.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects Linux home directory', async () => {
    const r = await guard.check('File is at /home/admin/config.json', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects macOS user path', async () => {
    const r = await guard.check('Located at /Users/john/Documents/secret.txt', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Windows user path', async () => {
    const r = await guard.check('See C:\\Users\\admin\\Desktop\\file.txt', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects /etc/passwd', async () => {
    const r = await guard.check('Read /etc/passwd for user list', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects /var/log paths', async () => {
    const r = await guard.check('Check /var/log/syslog for errors', ctx);
    expect(r.passed).toBe(false);
  });

  it('respects warn action', async () => {
    const warnGuard = filePathDetect({ action: 'warn' });
    const r = await warnGuard.check('/home/deploy/app.js', ctx);
    expect(r.action).toBe('warn');
  });
});
