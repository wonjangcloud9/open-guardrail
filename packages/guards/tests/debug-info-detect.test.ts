import { describe, it, expect } from 'vitest';
import { debugInfoDetect } from '../src/debug-info-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('debugInfoDetect', () => {
  const guard = debugInfoDetect({ action: 'block' });

  it('allows normal text', async () => {
    const r = await guard.check('Use logging to track application behavior.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects console.log', async () => {
    const r = await guard.check('console.log("user data:", data)', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects print statement', async () => {
    const r = await guard.check('print(user.password)', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects DEBUG prefix', async () => {
    const r = await guard.check('DEBUG: Connection pool exhausted', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects debugger statement', async () => {
    const r = await guard.check('Add debugger before the loop', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects pdb.set_trace', async () => {
    const r = await guard.check('import pdb; pdb.set_trace()', ctx);
    expect(r.passed).toBe(false);
  });

  it('respects warn action', async () => {
    const warnGuard = debugInfoDetect({ action: 'warn' });
    const r = await warnGuard.check('console.log("test")', ctx);
    expect(r.action).toBe('warn');
  });
});
