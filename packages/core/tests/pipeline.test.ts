import { describe, it, expect, vi } from 'vitest';
import { createPipeline, pipe } from '../src/pipeline.js';
import type { Guard, GuardResult, GuardContext } from '../src/types.js';

function makeGuard(name: string, result: Partial<GuardResult> = {}): Guard {
  return {
    name,
    version: '1.0.0',
    description: `test guard ${name}`,
    category: 'custom',
    supportedStages: ['input', 'output'],
    check: vi.fn(async (): Promise<GuardResult> => ({
      guardName: name,
      passed: true,
      action: 'allow',
      latencyMs: 1,
      ...result,
    })),
  };
}

describe('Pipeline', () => {
  describe('createPipeline', () => {
    it('runs all guards and returns aggregated result', async () => {
      const g1 = makeGuard('g1');
      const g2 = makeGuard('g2');
      const p = createPipeline({ guards: [g1, g2], mode: 'run-all' });
      const result = await p.run('hello');
      expect(result.passed).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.action).toBe('allow');
    });

    it('fail-fast stops on first block', async () => {
      const g1 = makeGuard('g1', { passed: false, action: 'block' });
      const g2 = makeGuard('g2');
      const p = createPipeline({ guards: [g1, g2], mode: 'fail-fast' });
      const result = await p.run('hello');
      expect(result.passed).toBe(false);
      expect(result.action).toBe('block');
      expect(result.results).toHaveLength(1);
      expect(g2.check).not.toHaveBeenCalled();
    });

    it('run-all executes all guards even on block', async () => {
      const g1 = makeGuard('g1', { passed: false, action: 'block' });
      const g2 = makeGuard('g2', { passed: true, action: 'warn' });
      const p = createPipeline({ guards: [g1, g2], mode: 'run-all' });
      const result = await p.run('hello');
      expect(result.passed).toBe(false);
      expect(result.action).toBe('block');
      expect(result.results).toHaveLength(2);
    });

    it('respects action priority: block > override > warn > allow', async () => {
      const g1 = makeGuard('g1', { passed: true, action: 'warn' });
      const g2 = makeGuard('g2', { passed: true, action: 'allow' });
      const p = createPipeline({ guards: [g1, g2], mode: 'run-all' });
      const result = await p.run('hello');
      expect(result.action).toBe('warn');
      expect(result.passed).toBe(true);
    });

    it('dryRun mode always passes', async () => {
      const g1 = makeGuard('g1', { passed: false, action: 'block' });
      const p = createPipeline({ guards: [g1], dryRun: true });
      const result = await p.run('hello');
      expect(result.passed).toBe(true);
      expect(result.metadata.dryRun).toBe(true);
      expect(result.results[0].action).toBe('block');
    });

    it('handles guard exception with onError=block (default)', async () => {
      const g1: Guard = {
        name: 'bad', version: '1.0.0', description: 'throws',
        category: 'custom', supportedStages: ['input'],
        check: async () => { throw new Error('boom'); },
      };
      const p = createPipeline({ guards: [g1] });
      const result = await p.run('hello');
      expect(result.passed).toBe(false);
      expect(result.results[0].error?.code).toBe('EXCEPTION');
    });

    it('handles guard exception with onError=allow', async () => {
      const g1: Guard = {
        name: 'bad', version: '1.0.0', description: 'throws',
        category: 'custom', supportedStages: ['input'],
        check: async () => { throw new Error('boom'); },
      };
      const p = createPipeline({ guards: [g1], onError: 'allow' });
      const result = await p.run('hello');
      expect(result.passed).toBe(true);
      expect(result.results[0].error?.code).toBe('EXCEPTION');
    });

    it('applies override text to output', async () => {
      const g1 = makeGuard('g1', {
        action: 'override',
        overrideText: 'redacted',
        passed: true,
      });
      const p = createPipeline({ guards: [g1], mode: 'run-all' });
      const result = await p.run('secret data');
      expect(result.output).toBe('redacted');
    });

    it('calls init() on guards that have it', async () => {
      const initFn = vi.fn(async () => {});
      const g1 = { ...makeGuard('g1'), init: initFn };
      const p = createPipeline({ guards: [g1] });
      await p.run('hello');
      expect(initFn).toHaveBeenCalledOnce();
    });
  });

  describe('pipe()', () => {
    it('is shorthand for createPipeline with defaults', async () => {
      const g1 = makeGuard('g1');
      const result = await pipe(g1).run('hello');
      expect(result.passed).toBe(true);
      expect(result.metadata.pipelineType).toBe('input');
      expect(result.metadata.mode).toBe('fail-fast');
    });
  });
});
