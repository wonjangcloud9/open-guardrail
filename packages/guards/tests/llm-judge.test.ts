import { describe, it, expect, vi } from 'vitest';
import { llmJudge } from '../src/llm-judge.js';

const ctx = { pipelineType: 'output' as const };

describe('llm-judge guard', () => {
  it('passes when parseResponse returns passed', async () => {
    const guard = llmJudge({
      action: 'block',
      callLlm: vi.fn().mockResolvedValue('SAFE'),
      systemPrompt: 'You are a judge.',
      userPromptTemplate: 'Evaluate: {{text}}',
      parseResponse: () => ({
        passed: true,
        score: 0,
        reason: 'safe',
      }),
    });

    const r = await guard.check('hello', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('blocks when parseResponse returns failed', async () => {
    const guard = llmJudge({
      action: 'block',
      callLlm: vi
        .fn()
        .mockResolvedValue('UNSAFE'),
      systemPrompt: 'You are a judge.',
      userPromptTemplate: 'Evaluate: {{text}}',
      parseResponse: () => ({
        passed: false,
        score: 1,
        reason: 'toxic',
      }),
    });

    const r = await guard.check('bad text', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
    expect(r.message).toBe('toxic');
  });

  it('warns instead of blocking', async () => {
    const guard = llmJudge({
      action: 'warn',
      callLlm: vi
        .fn()
        .mockResolvedValue('UNSAFE'),
      systemPrompt: 'Judge.',
      userPromptTemplate: '{{text}}',
      parseResponse: () => ({
        passed: false,
      }),
    });

    const r = await guard.check('x', ctx);
    expect(r.action).toBe('warn');
  });

  it('substitutes {{text}} in template', async () => {
    const mockLlm = vi
      .fn()
      .mockResolvedValue('ok');
    const guard = llmJudge({
      action: 'block',
      callLlm: mockLlm,
      systemPrompt: 'sys',
      userPromptTemplate:
        'Check: {{text}} end',
      parseResponse: () => ({ passed: true }),
    });

    await guard.check('HELLO', ctx);
    const prompt = mockLlm.mock.calls[0][0];
    expect(prompt).toContain('Check: HELLO end');
    expect(prompt).not.toContain('{{text}}');
  });

  it('handles callLlm throwing', async () => {
    const guard = llmJudge({
      action: 'block',
      callLlm: vi
        .fn()
        .mockRejectedValue(new Error('timeout')),
      systemPrompt: 'sys',
      userPromptTemplate: '{{text}}',
      parseResponse: () => ({ passed: true }),
    });

    const r = await guard.check('x', ctx);
    expect(r.passed).toBe(false);
    expect(r.error?.code).toBe('EXCEPTION');
    expect(r.error?.message).toBe('timeout');
  });
});
