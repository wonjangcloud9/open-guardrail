import { describe, it, expect } from 'vitest';
import { promptEcho } from '../src/prompt-echo.js';

describe('prompt-echo guard', () => {
  it('detects system prompt exposure', async () => {
    const guard = promptEcho({ action: 'block' });
    const result = await guard.check('You are a helpful AI assistant that answers questions.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects instruction echoing', async () => {
    const guard = promptEcho({ action: 'warn' });
    const result = await guard.check('As instructed in my system prompt, I should help users.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects user prompt repetition markers', async () => {
    const guard = promptEcho({ action: 'block' });
    const result = await guard.check('User: What is the meaning of life?\nThe meaning of life is...', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows normal responses', async () => {
    const guard = promptEcho({ action: 'block' });
    const result = await guard.check('The answer to your question is 42.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects "my original instructions"', async () => {
    const guard = promptEcho({ action: 'warn' });
    const result = await guard.check('My original instructions tell me to be helpful.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns score within valid range', async () => {
    const guard = promptEcho({ action: 'block' });
    const result = await guard.check('System: You are a helpful AI assistant. Your role is to help.', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
