import { describe, it, expect, vi } from 'vitest';
import { GuardrailRunnable, createGuardrailChain, GuardrailBlockedError } from '../src/index.js';
import { Pipeline } from 'open-guardrail-core';
import type { Guard, GuardResult } from 'open-guardrail-core';

function makeGuard(name: string, opts: { block?: boolean; override?: string } = {}): Guard {
  return {
    name, version: '1.0.0', description: name, category: 'custom',
    supportedStages: ['input', 'output'],
    async check(text: string): Promise<GuardResult> {
      if (opts.override) {
        return { guardName: name, passed: true, action: 'override', overrideText: opts.override, latencyMs: 0 };
      }
      return { guardName: name, passed: !opts.block, action: opts.block ? 'block' : 'allow', latencyMs: 0 };
    },
  };
}

describe('GuardrailRunnable', () => {
  it('passes clean input through', async () => {
    const pipeline = new Pipeline({ guards: [makeGuard('g1')] });
    const runnable = new GuardrailRunnable({ input: pipeline });
    const result = await runnable.invoke('hello');
    expect(result).toBe('hello');
  });

  it('throws on blocked input', async () => {
    const pipeline = new Pipeline({ guards: [makeGuard('g1', { block: true })] });
    const runnable = new GuardrailRunnable({ input: pipeline });
    await expect(runnable.invoke('bad')).rejects.toThrow(GuardrailBlockedError);
  });

  it('returns masked text on override', async () => {
    const pipeline = new Pipeline({ guards: [makeGuard('g1', { override: 'safe' })], mode: 'run-all' });
    const runnable = new GuardrailRunnable({ input: pipeline });
    const result = await runnable.invoke('sensitive');
    expect(result).toBe('safe');
  });

  it('calls onBlocked callback', async () => {
    const pipeline = new Pipeline({ guards: [makeGuard('g1', { block: true })] });
    const onBlocked = vi.fn();
    const runnable = new GuardrailRunnable({ input: pipeline, onBlocked });
    await expect(runnable.invoke('bad')).rejects.toThrow();
    expect(onBlocked).toHaveBeenCalledWith(expect.objectContaining({ passed: false }), 'input');
  });

  it('guards output text', async () => {
    const pipeline = new Pipeline({ guards: [makeGuard('g1', { block: true })] });
    const runnable = new GuardrailRunnable({ output: pipeline });
    await expect(runnable.guardOutput('bad output')).rejects.toThrow(GuardrailBlockedError);
  });

  it('batch processes multiple inputs', async () => {
    const pipeline = new Pipeline({ guards: [makeGuard('g1')] });
    const runnable = new GuardrailRunnable({ input: pipeline });
    const results = await runnable.batch(['a', 'b', 'c']);
    expect(results).toEqual(['a', 'b', 'c']);
  });

  it('passes through when no pipeline configured', async () => {
    const runnable = new GuardrailRunnable({});
    expect(await runnable.guardInput('hello')).toBe('hello');
    expect(await runnable.guardOutput('world')).toBe('world');
  });
});

describe('createGuardrailChain', () => {
  it('is factory for GuardrailRunnable', () => {
    const chain = createGuardrailChain({});
    expect(chain).toBeInstanceOf(GuardrailRunnable);
  });
});
