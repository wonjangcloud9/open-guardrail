import { describe, it, expect } from 'vitest';
import { logInjection } from '../src/log-injection.js';

const ctx = { pipelineType: 'input' as const };

describe('log-injection guard', () => {
  it('detects fake log entry', async () => {
    const guard = logInjection({ action: 'block' });
    const result = await guard.check('normal input\n[INFO] User admin logged in', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects ANSI escape sequences', async () => {
    const guard = logInjection({ action: 'block' });
    const result = await guard.check('text with \x1b[31mred color\x1b[0m', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects encoded ANSI escapes', async () => {
    const guard = logInjection({ action: 'block' });
    const result = await guard.check('data with \\x1b[31m injection', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects newline-based log level spoofing', async () => {
    const guard = logInjection({ action: 'warn' });
    const result = await guard.check('input\n[ERROR] Critical security breach detected', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects encoded newline injection', async () => {
    const guard = logInjection({ action: 'block' });
    const result = await guard.check('username%0a[WARN] Admin access granted', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows clean text', async () => {
    const guard = logInjection({ action: 'block' });
    const result = await guard.check('Hello, please log me in as user', ctx);
    expect(result.passed).toBe(true);
  });
});
