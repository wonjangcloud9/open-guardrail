import { describe, it, expect, vi } from 'vitest';
import { when, compose, not, retry, fallback } from '../src/guard-utils.js';
import type { Guard, GuardResult } from '../src/types.js';

function makeGuard(name: string, action: 'allow' | 'block' | 'warn' | 'override' = 'allow', overrideText?: string): Guard {
  return {
    name, version: '1.0.0', description: name, category: 'custom',
    supportedStages: ['input', 'output'],
    async check(): Promise<GuardResult> {
      return {
        guardName: name,
        passed: action !== 'block',
        action,
        overrideText,
        latencyMs: 0,
      };
    },
  };
}

const ctx = { pipelineType: 'input' as const };

describe('when', () => {
  it('runs guard when condition is true', async () => {
    const guard = when(() => true, makeGuard('test', 'block'));
    const r = await guard.check('hi', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });

  it('skips guard when condition is false', async () => {
    const guard = when(() => false, makeGuard('test', 'block'));
    const r = await guard.check('hi', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
    expect(r.message).toContain('skipped');
  });

  it('supports async condition', async () => {
    const guard = when(async (text) => text.length > 5, makeGuard('test', 'block'));
    const short = await guard.check('hi', ctx);
    expect(short.passed).toBe(true);

    const long = await guard.check('hello world', ctx);
    expect(long.passed).toBe(false);
  });

  it('passes text and context to condition', async () => {
    const guard = when(
      (text, c) => c.pipelineType === 'input' && text.includes('check'),
      makeGuard('test', 'warn'),
    );
    const r = await guard.check('check this', ctx);
    expect(r.action).toBe('warn');
  });
});

describe('compose', () => {
  it('runs all guards and returns highest action', async () => {
    const bundle = compose('bundle',
      makeGuard('a', 'allow'),
      makeGuard('b', 'warn'),
    );
    const r = await bundle.check('hi', ctx);
    expect(r.action).toBe('warn');
    expect(r.guardName).toBe('bundle');
  });

  it('stops at block in sequential execution', async () => {
    const bundle = compose('bundle',
      makeGuard('a', 'block'),
      makeGuard('b', 'allow'),
    );
    const r = await bundle.check('hi', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });

  it('chains override text through guards', async () => {
    const bundle = compose('bundle',
      makeGuard('masker', 'override', 'masked text'),
      makeGuard('checker', 'allow'),
    );
    const r = await bundle.check('original', ctx);
    expect(r.overrideText).toBe('masked text');
  });

  it('provides sub-results in details', async () => {
    const bundle = compose('bundle',
      makeGuard('a', 'allow'),
      makeGuard('b', 'warn'),
    );
    const r = await bundle.check('hi', ctx);
    expect(r.details?.subResults).toHaveLength(2);
  });
});

describe('not', () => {
  it('inverts pass to block', async () => {
    const guard = not(makeGuard('test', 'allow'));
    const r = await guard.check('hi', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });

  it('inverts block to allow', async () => {
    const guard = not(makeGuard('test', 'block'));
    const r = await guard.check('hi', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('supports custom action on inversion', async () => {
    const guard = not(makeGuard('test', 'allow'), 'warn');
    const r = await guard.check('hi', ctx);
    expect(r.action).toBe('warn');
  });
});

describe('retry', () => {
  it('returns result on first success', async () => {
    const guard = retry(makeGuard('ok', 'allow'), { maxRetries: 2 });
    const r = await guard.check('hi', ctx);
    expect(r.passed).toBe(true);
  });

  it('retries on failure and succeeds', async () => {
    let calls = 0;
    const flaky: Guard = {
      ...makeGuard('flaky'),
      async check() {
        calls++;
        if (calls < 3) throw new Error('network error');
        return { guardName: 'flaky', passed: true, action: 'allow', latencyMs: 0 };
      },
    };
    const guard = retry(flaky, { maxRetries: 3, delayMs: 10 });
    const r = await guard.check('hi', ctx);
    expect(r.passed).toBe(true);
    expect(calls).toBe(3);
  });

  it('returns exhausted result after all retries fail', async () => {
    const failing: Guard = {
      ...makeGuard('fail'),
      async check() { throw new Error('always fails'); },
    };
    const guard = retry(failing, { maxRetries: 1, delayMs: 10 });
    const r = await guard.check('hi', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
    expect(r.message).toContain('2 attempts failed');
  });

  it('respects onExhausted: allow', async () => {
    const failing: Guard = {
      ...makeGuard('fail'),
      async check() { throw new Error('fail'); },
    };
    const guard = retry(failing, { maxRetries: 0, delayMs: 0, onExhausted: 'allow' });
    const r = await guard.check('hi', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });
});

describe('fallback', () => {
  it('uses primary when it succeeds', async () => {
    const guard = fallback(makeGuard('primary', 'block'), makeGuard('secondary', 'allow'));
    const r = await guard.check('hi', ctx);
    expect(r.action).toBe('block');
    expect(r.guardName).toBe('primary');
  });

  it('uses secondary when primary throws', async () => {
    const failing: Guard = {
      ...makeGuard('primary'),
      async check() { throw new Error('fail'); },
    };
    const guard = fallback(failing, makeGuard('secondary', 'warn'));
    const r = await guard.check('hi', ctx);
    expect(r.action).toBe('warn');
    expect(r.guardName).toBe('secondary');
  });
});
