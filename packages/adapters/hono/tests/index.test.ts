import { describe, it, expect, vi } from 'vitest';
import {
  createGuardrailMiddleware,
  createOutputGuard,
  GuardrailBlockedError,
} from '../src/index.js';

function mockPipeline(overrides: Record<string, unknown> = {}) {
  const defaults = {
    passed: true,
    action: 'allow' as const,
    results: [],
    input: '',
    totalLatencyMs: 1,
    metadata: {
      pipelineType: 'input' as const,
      mode: 'fail-fast' as const,
      dryRun: false,
      timestamp: '',
    },
  };
  return { run: vi.fn().mockResolvedValue({ ...defaults, ...overrides }) };
}

function mockContext(body: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>();
  return {
    req: { json: vi.fn().mockResolvedValue(body) },
    json: vi.fn((data: unknown, status?: number) => ({ data, status })),
    set: vi.fn((key: string, val: unknown) => store.set(key, val)),
    get: vi.fn((key: string) => store.get(key)),
    _store: store,
  } as any;
}

describe('createGuardrailMiddleware', () => {
  it('passes safe text through and calls next', async () => {
    const pipeline = mockPipeline();
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const c = mockContext({ message: 'hello' });
    const next = vi.fn();

    await mw(c, next);

    expect(pipeline.run).toHaveBeenCalledWith('hello');
    expect(next).toHaveBeenCalled();
    expect(c.json).not.toHaveBeenCalled();
  });

  it('blocks unsafe text with 403 response', async () => {
    const pipeline = mockPipeline({
      passed: false,
      action: 'block',
      results: [{ guardName: 'toxicity', passed: false }],
    });
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const c = mockContext({ message: 'bad stuff' });
    const next = vi.fn();

    await mw(c, next);

    expect(c.json).toHaveBeenCalledWith(
      { error: 'blocked', action: 'block', guardName: 'toxicity' },
      403,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('overrides text when pipeline returns modified output', async () => {
    const pipeline = mockPipeline({ output: '[MASKED] world' });
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const c = mockContext({ message: 'hello world' });
    const next = vi.fn();

    await mw(c, next);

    expect(c.set).toHaveBeenCalledWith('guardrailBody', { message: '[MASKED] world' });
    expect(next).toHaveBeenCalled();
  });

  it('uses custom fieldName', async () => {
    const pipeline = mockPipeline();
    const mw = createGuardrailMiddleware({ input: pipeline as any, fieldName: 'prompt' });
    const c = mockContext({ prompt: 'my prompt' });
    const next = vi.fn();

    await mw(c, next);

    expect(pipeline.run).toHaveBeenCalledWith('my prompt');
  });

  it('uses custom inputFrom extractor', async () => {
    const pipeline = mockPipeline();
    const inputFrom = async (ctx: any) => {
      const body = await ctx.req.json();
      return body.prompt as string;
    };
    const mw = createGuardrailMiddleware({ input: pipeline as any, inputFrom });
    const c = mockContext({ prompt: 'custom input' });
    const next = vi.fn();

    await mw(c, next);

    expect(pipeline.run).toHaveBeenCalledWith('custom input');
  });

  it('calls custom onBlocked handler', async () => {
    const pipeline = mockPipeline({ passed: false, action: 'block', results: [] });
    const onBlocked = vi.fn();
    const mw = createGuardrailMiddleware({ input: pipeline as any, onBlocked });
    const c = mockContext({ message: 'bad' });
    const next = vi.fn();

    await mw(c, next);

    expect(onBlocked).toHaveBeenCalledWith(
      expect.objectContaining({ passed: false }),
      c,
    );
    expect(c.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('passes through when no input pipeline is set', async () => {
    const mw = createGuardrailMiddleware({});
    const c = mockContext({ message: 'hello' });
    const next = vi.fn();

    await mw(c, next);

    expect(next).toHaveBeenCalled();
  });

  it('sets guardrailResult on context', async () => {
    const pipeline = mockPipeline({ passed: true, action: 'allow' });
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const c = mockContext({ message: 'hello' });
    const next = vi.fn();

    await mw(c, next);

    expect(c.set).toHaveBeenCalledWith(
      'guardrailResult',
      expect.objectContaining({ passed: true, action: 'allow' }),
    );
  });

  it('skips when body field is not a string', async () => {
    const pipeline = mockPipeline();
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const c = mockContext({ message: 123 });
    const next = vi.fn();

    await mw(c, next);

    expect(pipeline.run).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('returns onBlocked response when handler returns a Response', async () => {
    const pipeline = mockPipeline({ passed: false, action: 'block', results: [] });
    const fakeResponse = new Response('custom block');
    const onBlocked = vi.fn().mockReturnValue(fakeResponse);
    const mw = createGuardrailMiddleware({ input: pipeline as any, onBlocked });
    const c = mockContext({ message: 'bad' });
    const next = vi.fn();

    const result = await mw(c, next);

    expect(result).toBe(fakeResponse);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('createOutputGuard', () => {
  it('returns safe text as-is', async () => {
    const pipeline = mockPipeline();
    const guard = createOutputGuard({ output: pipeline as any });

    const result = await guard('safe text');

    expect(pipeline.run).toHaveBeenCalledWith('safe text');
    expect(result).toBe('safe text');
  });

  it('returns overridden text when pipeline provides output', async () => {
    const pipeline = mockPipeline({ output: '[REDACTED] text' });
    const guard = createOutputGuard({ output: pipeline as any });

    const result = await guard('sensitive text');

    expect(result).toBe('[REDACTED] text');
  });

  it('throws GuardrailBlockedError when output is blocked', async () => {
    const pipeline = mockPipeline({ passed: false, action: 'block' });
    const onBlocked = vi.fn();
    const guard = createOutputGuard({ output: pipeline as any, onBlocked });

    await expect(guard('bad output')).rejects.toThrow(GuardrailBlockedError);
    expect(onBlocked).toHaveBeenCalled();
  });
});

describe('GuardrailBlockedError', () => {
  it('has correct name, stage, result, and message', () => {
    const result = {
      passed: false,
      action: 'block' as const,
      results: [],
      input: 'test',
      totalLatencyMs: 1,
      metadata: {
        pipelineType: 'input' as const,
        mode: 'fail-fast' as const,
        dryRun: false,
        timestamp: '',
      },
    };
    const err = new GuardrailBlockedError('input', result);

    expect(err.name).toBe('GuardrailBlockedError');
    expect(err.stage).toBe('input');
    expect(err.result).toBe(result);
    expect(err.message).toContain('input');
    expect(err.message).toContain('block');
    expect(err).toBeInstanceOf(Error);
  });
});
