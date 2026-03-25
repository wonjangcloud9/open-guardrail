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

function mockReq(body: Record<string, unknown> = {}, query: Record<string, unknown> = {}) {
  return { body, query } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('createGuardrailMiddleware', () => {
  it('passes safe text through and calls next', async () => {
    const pipeline = mockPipeline();
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const req = mockReq({ message: 'hello' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(pipeline.run).toHaveBeenCalledWith('hello');
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('blocks unsafe text with 403 response', async () => {
    const pipeline = mockPipeline({
      passed: false,
      action: 'block',
      results: [{ guardName: 'toxicity', passed: false }],
    });
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const req = mockReq({ message: 'bad stuff' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'blocked',
      action: 'block',
      guardName: 'toxicity',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('replaces text when pipeline returns override', async () => {
    const pipeline = mockPipeline({ output: '[MASKED] world' });
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const req = mockReq({ message: 'hello world' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(req.body.message).toBe('[MASKED] world');
    expect(next).toHaveBeenCalled();
  });

  it('uses custom inputFrom function', async () => {
    const pipeline = mockPipeline();
    const extractor = (r: any) => r.body.prompt;
    const mw = createGuardrailMiddleware({ input: pipeline as any, inputFrom: extractor });
    const req = mockReq({ prompt: 'custom input' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(pipeline.run).toHaveBeenCalledWith('custom input');
  });

  it('uses custom fieldName', async () => {
    const pipeline = mockPipeline();
    const mw = createGuardrailMiddleware({ input: pipeline as any, fieldName: 'prompt' });
    const req = mockReq({ prompt: 'my prompt' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(pipeline.run).toHaveBeenCalledWith('my prompt');
  });

  it('calls custom onBlocked handler', async () => {
    const pipeline = mockPipeline({ passed: false, action: 'block', results: [] });
    const onBlocked = vi.fn();
    const mw = createGuardrailMiddleware({ input: pipeline as any, onBlocked });
    const req = mockReq({ message: 'bad' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(onBlocked).toHaveBeenCalledWith(
      expect.objectContaining({ passed: false }),
      req,
      res,
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('passes through when no input pipeline is set', async () => {
    const mw = createGuardrailMiddleware({});
    const req = mockReq({ message: 'hello' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('attaches pipeline result to request', async () => {
    const pipeline = mockPipeline({ passed: true, action: 'allow' });
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const req = mockReq({ message: 'hello' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(req.guardrailResult).toBeDefined();
    expect(req.guardrailResult.passed).toBe(true);
    expect(req.guardrailResult.action).toBe('allow');
  });

  it('reads from query when inputFrom is "query"', async () => {
    const pipeline = mockPipeline();
    const mw = createGuardrailMiddleware({ input: pipeline as any, inputFrom: 'query' });
    const req = mockReq({}, { message: 'from query' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(pipeline.run).toHaveBeenCalledWith('from query');
  });

  it('forwards errors to next', async () => {
    const pipeline = { run: vi.fn().mockRejectedValue(new Error('boom')) };
    const mw = createGuardrailMiddleware({ input: pipeline as any });
    const req = mockReq({ message: 'hello' });
    const res = mockRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
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
