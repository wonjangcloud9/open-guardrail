import { describe, it, expect, vi } from 'vitest';
import { guardedCompletions, createGuardedOpenAI, GuardrailBlockedError } from '../src/index.js';

function mockPipeline(overrides: Record<string, unknown> = {}) {
  const defaults = {
    passed: true,
    action: 'allow' as const,
    results: [],
    input: '',
    totalLatencyMs: 1,
    metadata: { pipelineType: 'input' as const, mode: 'fail-fast' as const, dryRun: false, timestamp: '' },
  };
  return {
    run: vi.fn().mockResolvedValue({ ...defaults, ...overrides }),
  };
}

function mockCreateFn(content = 'Hello from GPT!') {
  return vi.fn().mockResolvedValue({
    choices: [{ message: { role: 'assistant', content }, index: 0 }],
  });
}

describe('guardedCompletions', () => {
  const baseParams = {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hi there' }],
  };

  it('passes through when no pipelines are set', async () => {
    const create = mockCreateFn();
    const guarded = guardedCompletions(create, {});
    const res = await guarded(baseParams);

    expect(create).toHaveBeenCalledWith(baseParams);
    expect(res.choices[0].message.content).toBe('Hello from GPT!');
  });

  it('runs input pipeline and passes when allowed', async () => {
    const create = mockCreateFn();
    const input = mockPipeline();
    const guarded = guardedCompletions(create, { input: input as any });

    await guarded(baseParams);

    expect(input.run).toHaveBeenCalledWith('Hi there');
    expect(create).toHaveBeenCalled();
  });

  it('throws GuardrailBlockedError when input is blocked', async () => {
    const create = mockCreateFn();
    const input = mockPipeline({ passed: false, action: 'block' });
    const onBlocked = vi.fn();
    const guarded = guardedCompletions(create, { input: input as any, onBlocked });

    await expect(guarded(baseParams)).rejects.toThrow(GuardrailBlockedError);
    expect(onBlocked).toHaveBeenCalledWith(expect.objectContaining({ passed: false }), 'input');
    expect(create).not.toHaveBeenCalled();
  });

  it('replaces user message when input pipeline overrides', async () => {
    const create = mockCreateFn();
    const input = mockPipeline({ output: '[MASKED] there' });
    const guarded = guardedCompletions(create, { input: input as any });

    await guarded(baseParams);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: '[MASKED] there' }],
      }),
    );
  });

  it('runs output pipeline on response', async () => {
    const create = mockCreateFn('Response with email@test.com');
    const output = mockPipeline({ output: 'Response with [REDACTED]' });
    const guarded = guardedCompletions(create, { output: output as any });

    const res = await guarded(baseParams);

    expect(output.run).toHaveBeenCalledWith('Response with email@test.com');
    expect(res.choices[0].message.content).toBe('Response with [REDACTED]');
  });

  it('throws GuardrailBlockedError when output is blocked', async () => {
    const create = mockCreateFn('bad output');
    const output = mockPipeline({ passed: false, action: 'block' });
    const onBlocked = vi.fn();
    const guarded = guardedCompletions(create, { output: output as any, onBlocked });

    await expect(guarded(baseParams)).rejects.toThrow(GuardrailBlockedError);
    expect(onBlocked).toHaveBeenCalledWith(expect.objectContaining({ passed: false }), 'output');
  });

  it('handles multi-part content in user message', async () => {
    const create = mockCreateFn();
    const input = mockPipeline();
    const guarded = guardedCompletions(create, { input: input as any });

    await guarded({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'Describe this image' }] },
      ],
    });

    expect(input.run).toHaveBeenCalledWith('Describe this image');
  });

  it('skips guard when no user message found', async () => {
    const create = mockCreateFn();
    const input = mockPipeline();
    const guarded = guardedCompletions(create, { input: input as any });

    await guarded({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: 'You are helpful' }],
    });

    expect(input.run).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
  });
});

describe('createGuardedOpenAI', () => {
  it('wraps client and guards input', async () => {
    const create = mockCreateFn();
    const client = { chat: { completions: { create } } };
    const input = mockPipeline();

    const guarded = createGuardedOpenAI(client, { input: input as any });
    await guarded.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Test' }],
    });

    expect(input.run).toHaveBeenCalledWith('Test');
  });
});

describe('GuardrailBlockedError', () => {
  it('has correct properties', () => {
    const result = {
      passed: false,
      action: 'block' as const,
      results: [],
      input: 'test',
      totalLatencyMs: 1,
      metadata: { pipelineType: 'input' as const, mode: 'fail-fast' as const, dryRun: false, timestamp: '' },
    };
    const err = new GuardrailBlockedError('input', result);

    expect(err.name).toBe('GuardrailBlockedError');
    expect(err.stage).toBe('input');
    expect(err.result).toBe(result);
    expect(err.message).toContain('input');
  });
});
