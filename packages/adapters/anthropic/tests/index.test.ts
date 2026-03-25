import { describe, it, expect, vi } from 'vitest';
import { guardedMessages, createGuardedAnthropic, GuardrailBlockedError } from '../src/index.js';

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

function mockCreateFn(text = 'Hello from Claude!') {
  return vi.fn().mockResolvedValue({
    content: [{ type: 'text', text }],
    role: 'assistant',
    model: 'claude-sonnet-4-20250514',
    stop_reason: 'end_turn',
  });
}

describe('guardedMessages', () => {
  const baseParams = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hi there' }],
  };

  it('passes through when no pipelines are set', async () => {
    const create = mockCreateFn();
    const guarded = guardedMessages(create, {});
    const res = await guarded(baseParams);

    expect(create).toHaveBeenCalledWith(baseParams);
    expect(res.content[0].text).toBe('Hello from Claude!');
  });

  it('runs input pipeline and passes when allowed', async () => {
    const create = mockCreateFn();
    const input = mockPipeline();
    const guarded = guardedMessages(create, { input: input as any });

    await guarded(baseParams);

    expect(input.run).toHaveBeenCalledWith('Hi there');
    expect(create).toHaveBeenCalled();
  });

  it('throws GuardrailBlockedError when input is blocked', async () => {
    const create = mockCreateFn();
    const input = mockPipeline({ passed: false, action: 'block' });
    const onBlocked = vi.fn();
    const guarded = guardedMessages(create, { input: input as any, onBlocked });

    await expect(guarded(baseParams)).rejects.toThrow(GuardrailBlockedError);
    expect(onBlocked).toHaveBeenCalledWith(expect.objectContaining({ passed: false }), 'input');
    expect(create).not.toHaveBeenCalled();
  });

  it('replaces user message when input pipeline overrides', async () => {
    const create = mockCreateFn();
    const input = mockPipeline({ output: '[MASKED] there' });
    const guarded = guardedMessages(create, { input: input as any });

    await guarded(baseParams);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: '[MASKED] there' }],
      }),
    );
  });

  it('runs output pipeline on response text blocks', async () => {
    const create = mockCreateFn('Response with email@test.com');
    const output = mockPipeline({ output: 'Response with [REDACTED]' });
    const guarded = guardedMessages(create, { output: output as any });

    const res = await guarded(baseParams);

    expect(output.run).toHaveBeenCalledWith('Response with email@test.com');
    expect(res.content[0].text).toBe('Response with [REDACTED]');
  });

  it('throws GuardrailBlockedError when output is blocked', async () => {
    const create = mockCreateFn('bad output');
    const output = mockPipeline({ passed: false, action: 'block' });
    const onBlocked = vi.fn();
    const guarded = guardedMessages(create, { output: output as any, onBlocked });

    await expect(guarded(baseParams)).rejects.toThrow(GuardrailBlockedError);
    expect(onBlocked).toHaveBeenCalledWith(expect.objectContaining({ passed: false }), 'output');
  });

  it('handles multi-part content in user message', async () => {
    const create = mockCreateFn();
    const input = mockPipeline();
    const guarded = guardedMessages(create, { input: input as any });

    await guarded({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'Describe this image' }] },
      ],
    });

    expect(input.run).toHaveBeenCalledWith('Describe this image');
  });

  it('skips guard when no user message found', async () => {
    const create = mockCreateFn();
    const input = mockPipeline();
    const guarded = guardedMessages(create, { input: input as any });

    await guarded({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'assistant', content: 'Previous response' }],
    });

    expect(input.run).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
  });

  it('skips non-text content blocks in output', async () => {
    const create = vi.fn().mockResolvedValue({
      content: [
        { type: 'tool_use', id: 'tool_1', name: 'get_weather', input: {} },
        { type: 'text', text: 'The weather is sunny' },
      ],
      role: 'assistant',
    });
    const output = mockPipeline({ output: 'The weather is [SAFE]' });
    const guarded = guardedMessages(create, { output: output as any });

    const res = await guarded(baseParams);

    expect(output.run).toHaveBeenCalledTimes(1);
    expect(output.run).toHaveBeenCalledWith('The weather is sunny');
    expect(res.content[0].type).toBe('tool_use');
    expect(res.content[1].text).toBe('The weather is [SAFE]');
  });
});

describe('createGuardedAnthropic', () => {
  it('wraps client and guards input', async () => {
    const create = mockCreateFn();
    const client = { messages: { create } };
    const input = mockPipeline();

    const guarded = createGuardedAnthropic(client, { input: input as any });
    await guarded.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
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
