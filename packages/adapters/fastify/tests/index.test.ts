import { describe, it, expect, vi } from 'vitest';
import {
  createGuardrailPlugin,
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

function mockRequest(body: Record<string, unknown> = {}) {
  return { body } as any;
}

function mockReply() {
  const reply: any = {};
  reply.code = vi.fn().mockReturnValue(reply);
  reply.send = vi.fn().mockReturnValue(reply);
  return reply;
}

function mockFastify() {
  const hooks: Record<string, Function[]> = {};
  return {
    addHook: vi.fn((name: string, fn: Function) => {
      hooks[name] = hooks[name] ?? [];
      hooks[name].push(fn);
    }),
    _hooks: hooks,
  };
}

async function registerPlugin(options: Parameters<typeof createGuardrailPlugin>[0]) {
  const fastify = mockFastify();
  const plugin = createGuardrailPlugin(options);
  await plugin(fastify);
  return fastify;
}

describe('createGuardrailPlugin', () => {
  it('registers a preHandler hook', async () => {
    const fastify = await registerPlugin({ input: mockPipeline() as any });

    expect(fastify.addHook).toHaveBeenCalledWith('preHandler', expect.any(Function));
    expect(fastify._hooks['preHandler']).toHaveLength(1);
  });

  it('guards safe text and attaches result to request', async () => {
    const pipeline = mockPipeline();
    const fastify = await registerPlugin({ input: pipeline as any });
    const handler = fastify._hooks['preHandler'][0];
    const request = mockRequest({ message: 'hello' });
    const reply = mockReply();

    await handler(request, reply);

    expect(pipeline.run).toHaveBeenCalledWith('hello');
    expect(reply.code).not.toHaveBeenCalled();
    expect(request.guardrailResult).toBeDefined();
    expect(request.guardrailResult.passed).toBe(true);
  });

  it('blocks unsafe text with 403 response', async () => {
    const pipeline = mockPipeline({
      passed: false,
      action: 'block',
      results: [{ guardName: 'toxicity', passed: false }],
    });
    const fastify = await registerPlugin({ input: pipeline as any });
    const handler = fastify._hooks['preHandler'][0];
    const request = mockRequest({ message: 'bad stuff' });
    const reply = mockReply();

    await handler(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'blocked',
      action: 'block',
      guardName: 'toxicity',
    });
  });

  it('overrides text when pipeline returns modified output', async () => {
    const pipeline = mockPipeline({ output: '[MASKED] world' });
    const fastify = await registerPlugin({ input: pipeline as any });
    const handler = fastify._hooks['preHandler'][0];
    const request = mockRequest({ message: 'hello world' });
    const reply = mockReply();

    await handler(request, reply);

    expect(request.body.message).toBe('[MASKED] world');
    expect(reply.code).not.toHaveBeenCalled();
  });

  it('uses custom fieldName', async () => {
    const pipeline = mockPipeline();
    const fastify = await registerPlugin({ input: pipeline as any, fieldName: 'prompt' });
    const handler = fastify._hooks['preHandler'][0];
    const request = mockRequest({ prompt: 'my prompt' });
    const reply = mockReply();

    await handler(request, reply);

    expect(pipeline.run).toHaveBeenCalledWith('my prompt');
  });

  it('uses custom inputFrom extractor', async () => {
    const pipeline = mockPipeline();
    const inputFrom = (r: any) => r.body.prompt;
    const fastify = await registerPlugin({ input: pipeline as any, inputFrom });
    const handler = fastify._hooks['preHandler'][0];
    const request = mockRequest({ prompt: 'custom input' });
    const reply = mockReply();

    await handler(request, reply);

    expect(pipeline.run).toHaveBeenCalledWith('custom input');
  });

  it('calls custom onBlocked handler', async () => {
    const pipeline = mockPipeline({ passed: false, action: 'block', results: [] });
    const onBlocked = vi.fn();
    const fastify = await registerPlugin({ input: pipeline as any, onBlocked });
    const handler = fastify._hooks['preHandler'][0];
    const request = mockRequest({ message: 'bad' });
    const reply = mockReply();

    await handler(request, reply);

    expect(onBlocked).toHaveBeenCalledWith(
      expect.objectContaining({ passed: false }),
      request,
      reply,
    );
    expect(reply.code).not.toHaveBeenCalled();
  });

  it('passes through when no input pipeline is set', async () => {
    const fastify = await registerPlugin({});
    const handler = fastify._hooks['preHandler'][0];
    const request = mockRequest({ message: 'hello' });
    const reply = mockReply();

    await handler(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
    expect(request.guardrailResult).toBeUndefined();
  });

  it('skips when body has no matching field', async () => {
    const pipeline = mockPipeline();
    const fastify = await registerPlugin({ input: pipeline as any });
    const handler = fastify._hooks['preHandler'][0];
    const request = mockRequest({ other: 'value' });
    const reply = mockReply();

    await handler(request, reply);

    expect(pipeline.run).not.toHaveBeenCalled();
    expect(reply.code).not.toHaveBeenCalled();
  });

  it('overrides correct field when using custom fieldName', async () => {
    const pipeline = mockPipeline({ output: '[REDACTED]' });
    const fastify = await registerPlugin({ input: pipeline as any, fieldName: 'prompt' });
    const handler = fastify._hooks['preHandler'][0];
    const request = mockRequest({ prompt: 'sensitive data' });
    const reply = mockReply();

    await handler(request, reply);

    expect(request.body.prompt).toBe('[REDACTED]');
  });
});

describe('createOutputGuard', () => {
  it('returns safe text unchanged', async () => {
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
