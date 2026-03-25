import { describe, it, expect } from 'vitest';
import { responseQuality } from '../src/response-quality.js';

const ctx = { pipelineType: 'output' as const };

describe('responseQuality', () => {
  const guard = responseQuality({ action: 'warn' });

  it('allows normal response', async () => {
    const r = await guard.check('Machine learning is a subset of AI that enables systems to learn from data.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('flags too-short response', async () => {
    const r = await guard.check('OK', ctx);
    expect(r.passed).toBe(false);
    expect(r.message).toContain('too-short');
  });

  it('flags empty response', async () => {
    const r = await guard.check('', ctx);
    expect(r.passed).toBe(false);
  });

  it('flags highly repetitive response', async () => {
    const repeated = Array(10).fill('This is a repeated sentence.').join(' ');
    const r = await guard.check(repeated, ctx);
    expect(r.passed).toBe(false);
    expect(r.message).toContain('repetitive');
  });

  it('allows response with some repetition under threshold', async () => {
    const text = 'First sentence. Second sentence. Third sentence. First sentence.';
    const r = await guard.check(text, ctx);
    expect(r.passed).toBe(true);
  });

  it('detects refusal pattern — "I\'m sorry"', async () => {
    const r = await guard.check("I'm sorry, but I cannot help with that request.", ctx);
    expect(r.passed).toBe(false);
    expect(r.message).toContain('refusal');
  });

  it('detects refusal pattern — "As an AI"', async () => {
    const r = await guard.check("As an AI language model, I don't have the ability to browse the internet.", ctx);
    expect(r.passed).toBe(false);
  });

  it('respects custom minLength', async () => {
    const strict = responseQuality({ action: 'warn', minLength: 50 });
    const r = await strict.check('Short answer here.', ctx);
    expect(r.passed).toBe(false);
  });

  it('respects detectRefusal: false', async () => {
    const noRefusal = responseQuality({ action: 'warn', detectRefusal: false });
    const r = await noRefusal.check("I'm sorry, but I cannot help with that request.", ctx);
    expect(r.passed).toBe(true);
  });

  it('respects block action', async () => {
    const blocker = responseQuality({ action: 'block' });
    const r = await blocker.check('OK', ctx);
    expect(r.action).toBe('block');
  });
});
