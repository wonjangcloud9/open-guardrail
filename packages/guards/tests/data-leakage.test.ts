import { describe, it, expect } from 'vitest';
import { dataLeakage } from '../src/data-leakage.js';

describe('data-leakage', () => {
  it('detects "As an AI language model"', async () => {
    const guard = dataLeakage({ action: 'block' });
    const result = await guard.check(
      'As an AI language model, I cannot do that.',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects system prompt patterns', async () => {
    const guard = dataLeakage({ action: 'warn' });
    const result = await guard.check(
      'System: You are a helpful assistant that answers questions.',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects custom sensitive strings', async () => {
    const guard = dataLeakage({
      action: 'block',
      sensitiveStrings: ['Project Omega'],
      detectSystemPrompt: false,
      detectInstructions: false,
    });
    const result = await guard.check(
      'The details of Project Omega are classified.',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(false);
  });

  it('allows normal output', async () => {
    const guard = dataLeakage({ action: 'block' });
    const result = await guard.check(
      'The weather today is sunny with clear skies.',
      { pipelineType: 'output' },
    );
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });
});
