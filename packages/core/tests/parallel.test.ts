import { describe, it, expect } from 'vitest';
import { parallel } from '../src/parallel.js';
import type { Guard, GuardContext, GuardResult } from '../src/types.js';

const ctx: GuardContext = { pipelineType: 'input' };

function makeGuard(name: string, pass: boolean, delayMs = 0): Guard {
  return {
    name,
    version: '0.1.0',
    description: 'test',
    category: 'custom',
    supportedStages: ['input'],
    async check(_text: string, _ctx: GuardContext): Promise<GuardResult> {
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      return { guardName: name, passed: pass, action: pass ? 'allow' : 'block', latencyMs: delayMs };
    },
  };
}

describe('parallel', () => {
  it('runs all guards concurrently (all pass)', async () => {
    const pg = parallel([makeGuard('a', true), makeGuard('b', true)]);
    const result = await pg.check('test', ctx);
    expect(result.passed).toBe(true);
    expect(result.details?.results.length).toBe(2);
  });

  it('blocks when any guard fails (all mode)', async () => {
    const pg = parallel([makeGuard('a', true), makeGuard('b', false)]);
    const result = await pg.check('test', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.blockedBy).toContain('b');
  });

  it('race-block returns early on first block', async () => {
    const pg = parallel(
      [makeGuard('fast-block', false, 5), makeGuard('slow-pass', true, 100)],
      { mode: 'race-block' },
    );
    const start = performance.now();
    const result = await pg.check('test', ctx);
    const elapsed = performance.now() - start;
    expect(result.passed).toBe(false);
    expect(elapsed).toBeLessThan(50);
  });

  it('race-block passes when all pass', async () => {
    const pg = parallel(
      [makeGuard('a', true, 5), makeGuard('b', true, 5)],
      { mode: 'race-block' },
    );
    const result = await pg.check('test', ctx);
    expect(result.passed).toBe(true);
  });

  it('handles timeout', async () => {
    const pg = parallel(
      [makeGuard('slow', true, 500)],
      { mode: 'race-block', timeoutMs: 20 },
    );
    const result = await pg.check('test', ctx);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('timed out');
  });
});
