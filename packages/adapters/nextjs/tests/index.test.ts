import { describe, it, expect, vi } from 'vitest';
import {
  createRouteGuard,
  guardApiRoute,
  guardResponse,
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

function mockRequest(body: Record<string, unknown> = { message: 'test' }): Request {
  return new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('createRouteGuard', () => {
  it('wraps handler and passes safe text', async () => {
    const pipeline = mockPipeline();
    const guard = createRouteGuard({ input: pipeline as any });
    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ reply: 'ok' }), { status: 200 }),
    );

    const wrapped = guard(handler);
    const response = await wrapped(mockRequest({ message: 'hello' }));

    expect(pipeline.run).toHaveBeenCalledWith('hello');
    expect(handler).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('blocks unsafe text with 403', async () => {
    const pipeline = mockPipeline({
      passed: false,
      action: 'block',
      results: [{ guardName: 'toxicity', passed: false }],
    });
    const guard = createRouteGuard({ input: pipeline as any });
    const handler = vi.fn();

    const wrapped = guard(handler);
    const response = await wrapped(mockRequest({ message: 'bad stuff' }));

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('blocked');
    expect(data.guardName).toBe('toxicity');
    expect(handler).not.toHaveBeenCalled();
  });

  it('overrides text when pipeline returns modified output', async () => {
    const pipeline = mockPipeline({ output: '[MASKED] world' });
    const guard = createRouteGuard({ input: pipeline as any });
    const handler = vi.fn().mockImplementation(async (req: Request) => {
      const body = await req.json();
      return new Response(JSON.stringify(body), { status: 200 });
    });

    const wrapped = guard(handler);
    const response = await wrapped(mockRequest({ message: 'hello world' }));

    expect(handler).toHaveBeenCalled();
    const body = await response.json();
    expect(body.message).toBe('[MASKED] world');
  });

  it('uses custom fieldName', async () => {
    const pipeline = mockPipeline();
    const guard = createRouteGuard({ input: pipeline as any, fieldName: 'prompt' });
    const handler = vi.fn().mockResolvedValue(new Response('ok'));

    const wrapped = guard(handler);
    await wrapped(mockRequest({ prompt: 'my prompt' }));

    expect(pipeline.run).toHaveBeenCalledWith('my prompt');
  });

  it('uses custom inputFrom extractor', async () => {
    const pipeline = mockPipeline();
    const guard = createRouteGuard({
      input: pipeline as any,
      inputFrom: (body: any) => body.nested.text,
    });
    const handler = vi.fn().mockResolvedValue(new Response('ok'));

    const wrapped = guard(handler);
    await wrapped(mockRequest({ nested: { text: 'deep value' } } as any));

    expect(pipeline.run).toHaveBeenCalledWith('deep value');
  });

  it('uses custom onBlocked handler', async () => {
    const pipeline = mockPipeline({
      passed: false,
      action: 'block',
      results: [{ guardName: 'injection', passed: false }],
    });
    const customResponse = new Response('Custom blocked', { status: 422 });
    const guard = createRouteGuard({
      input: pipeline as any,
      onBlocked: () => customResponse,
    });
    const handler = vi.fn();

    const wrapped = guard(handler);
    const response = await wrapped(mockRequest({ message: 'bad' }));

    expect(response.status).toBe(422);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('guardApiRoute', () => {
  it('returns body and result on safe text', async () => {
    const pipeline = mockPipeline();
    const guard = guardApiRoute({ input: pipeline as any });

    const result = await guard(mockRequest({ message: 'hello' }));

    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.body.message).toBe('hello');
      expect(result.result.passed).toBe(true);
    }
  });

  it('returns 403 Response on blocked text', async () => {
    const pipeline = mockPipeline({
      passed: false,
      action: 'block',
      results: [{ guardName: 'toxicity', passed: false }],
    });
    const guard = guardApiRoute({ input: pipeline as any });

    const result = await guard(mockRequest({ message: 'bad' }));

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(403);
      const data = await result.json();
      expect(data.error).toBe('blocked');
    }
  });

  it('overrides body field when pipeline modifies output', async () => {
    const pipeline = mockPipeline({ output: '[REDACTED]' });
    const guard = guardApiRoute({ input: pipeline as any });

    const result = await guard(mockRequest({ message: 'secret info' }));

    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.body.message).toBe('[REDACTED]');
    }
  });
});

describe('guardResponse', () => {
  it('guards output text and returns original if passed', async () => {
    const pipeline = mockPipeline();
    const text = await guardResponse(pipeline as any, 'safe output');

    expect(pipeline.run).toHaveBeenCalledWith('safe output');
    expect(text).toBe('safe output');
  });

  it('returns modified text when pipeline provides output', async () => {
    const pipeline = mockPipeline({ output: '[MASKED] output' });
    const text = await guardResponse(pipeline as any, 'sensitive output');

    expect(text).toBe('[MASKED] output');
  });

  it('throws GuardrailBlockedError when output is blocked', async () => {
    const pipeline = mockPipeline({ passed: false, action: 'block' });

    await expect(guardResponse(pipeline as any, 'bad output')).rejects.toThrow(
      GuardrailBlockedError,
    );
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
