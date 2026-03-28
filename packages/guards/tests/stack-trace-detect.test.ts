import { describe, it, expect } from 'vitest';
import { stackTraceDetect } from '../src/stack-trace-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('stackTraceDetect', () => {
  const guard = stackTraceDetect({ action: 'block' });

  it('allows normal text', async () => {
    const r = await guard.check('The function processes data and returns a result.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects JS stack trace', async () => {
    const r = await guard.check('TypeError: undefined is not a function\n    at Object.foo (/app/server.js:42:10)', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Python traceback', async () => {
    const r = await guard.check('Traceback (most recent call last):\n  File "app.py", line 42', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Java stack trace', async () => {
    const r = await guard.check('Exception in thread "main" java.lang.NullPointerException', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Python file reference', async () => {
    const r = await guard.check('File "models.py", line 15, in get_user', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Go panic', async () => {
    const r = await guard.check('panic: runtime error: index out of range', ctx);
    expect(r.passed).toBe(false);
  });

  it('respects warn action', async () => {
    const warnGuard = stackTraceDetect({ action: 'warn' });
    const r = await warnGuard.check('Traceback (most recent call last):', ctx);
    expect(r.action).toBe('warn');
  });
});
