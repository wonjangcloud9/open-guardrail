import { describe, it, expect, vi } from 'vitest';
import { createGuardrailMiddleware, GuardrailBlockedError } from '../src/index.js';
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

function makeParams(userMessage: string) {
  return {
    prompt: [
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: userMessage },
    ],
  };
}

describe('createGuardrailMiddleware', () => {
  describe('input guards (transformParams)', () => {
    it('passes clean input through', async () => {
      const pipeline = new Pipeline({ guards: [makeGuard('g1')] });
      const mw = createGuardrailMiddleware({ input: pipeline });

      const params = makeParams('hello world');
      const result = await mw.transformParams!({ params });
      expect(result.prompt[1].content).toBe('hello world');
    });

    it('throws GuardrailBlockedError on blocked input', async () => {
      const pipeline = new Pipeline({ guards: [makeGuard('g1', { block: true })] });
      const mw = createGuardrailMiddleware({ input: pipeline });

      const params = makeParams('bad input');
      await expect(mw.transformParams!({ params })).rejects.toThrow(GuardrailBlockedError);
    });

    it('calls onBlocked callback when blocked', async () => {
      const pipeline = new Pipeline({ guards: [makeGuard('g1', { block: true })] });
      const onBlocked = vi.fn();
      const mw = createGuardrailMiddleware({ input: pipeline, onBlocked });

      const params = makeParams('bad input');
      await expect(mw.transformParams!({ params })).rejects.toThrow();
      expect(onBlocked).toHaveBeenCalledWith(expect.objectContaining({ passed: false }), 'input');
    });

    it('replaces user message when guard overrides', async () => {
      const pipeline = new Pipeline({ guards: [makeGuard('g1', { override: 'masked text' })], mode: 'run-all' });
      const mw = createGuardrailMiddleware({ input: pipeline });

      const params = makeParams('sensitive data');
      const result = await mw.transformParams!({ params });
      expect(result.prompt[1].content).toBe('masked text');
    });

    it('skips when no user message found', async () => {
      const pipeline = new Pipeline({ guards: [makeGuard('g1')] });
      const mw = createGuardrailMiddleware({ input: pipeline });

      const params = { prompt: [{ role: 'system', content: 'hi' }] };
      const result = await mw.transformParams!({ params });
      expect(result).toEqual(params);
    });
  });

  describe('output guards (wrapGenerate)', () => {
    it('passes clean output through', async () => {
      const pipeline = new Pipeline({ guards: [makeGuard('g1')] });
      const mw = createGuardrailMiddleware({ output: pipeline });

      const doGenerate = async () => ({ text: 'hello response' });
      const result = await mw.wrapGenerate!({ doGenerate, params: makeParams('q') });
      expect(result.text).toBe('hello response');
    });

    it('throws on blocked output', async () => {
      const pipeline = new Pipeline({ guards: [makeGuard('g1', { block: true })] });
      const mw = createGuardrailMiddleware({ output: pipeline });

      const doGenerate = async () => ({ text: 'bad response' });
      await expect(mw.wrapGenerate!({ doGenerate, params: makeParams('q') })).rejects.toThrow(GuardrailBlockedError);
    });

    it('replaces output text when guard overrides', async () => {
      const pipeline = new Pipeline({ guards: [makeGuard('g1', { override: 'safe text' })], mode: 'run-all' });
      const mw = createGuardrailMiddleware({ output: pipeline });

      const doGenerate = async () => ({ text: 'sensitive response' });
      const result = await mw.wrapGenerate!({ doGenerate, params: makeParams('q') });
      expect(result.text).toBe('safe text');
    });
  });

  describe('no middleware when no pipelines', () => {
    it('returns empty middleware object', () => {
      const mw = createGuardrailMiddleware({});
      expect(mw.transformParams).toBeUndefined();
      expect(mw.wrapGenerate).toBeUndefined();
    });
  });
});
