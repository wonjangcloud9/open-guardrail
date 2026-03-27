import { describe, it, expect } from 'vitest';
import { contextWindowOverflow } from '../src/context-window-overflow.js';

describe('context-window-overflow guard', () => {
  it('passes small input', async () => {
    const guard = contextWindowOverflow({ action: 'block', maxTokens: 1000 });
    const r = await guard.check('Short text', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('blocks when context window is exceeded', async () => {
    const guard = contextWindowOverflow({ action: 'block', maxTokens: 10, charsPerToken: 1 });
    const r = await guard.check('This is a text longer than ten characters for sure', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
    expect(r.details?.utilization).toBeDefined();
  });

  it('warns near threshold', async () => {
    const guard = contextWindowOverflow({
      action: 'warn',
      maxTokens: 100,
      charsPerToken: 1,
      warnThreshold: 0.5,
    });
    const r = await guard.check('a'.repeat(60), { pipelineType: 'input' });
    expect(r.action).toBe('warn');
  });

  it('accumulates across multiple calls', async () => {
    const guard = contextWindowOverflow({ action: 'block', maxTokens: 20, charsPerToken: 1 });
    await guard.check('a'.repeat(10), { pipelineType: 'input' });
    await guard.check('b'.repeat(5), { pipelineType: 'input' });
    const r = await guard.check('c'.repeat(10), { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });

  it('has latencyMs field', async () => {
    const guard = contextWindowOverflow({ action: 'block' });
    const r = await guard.check('test', { pipelineType: 'input' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
