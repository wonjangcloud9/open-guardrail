import { describe, it, expect } from 'vitest';
import { personaConsistency } from '../src/persona-consistency.js';

describe('persona-consistency guard', () => {
  it('detects "as an AI" phrase', async () => {
    const guard = personaConsistency({ action: 'block' });
    const result = await guard.check('As an AI, I cannot help with that.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects "as a language model"', async () => {
    const guard = personaConsistency({ action: 'warn' });
    const result = await guard.check('As a language model, I have limitations.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects "my training data"', async () => {
    const guard = personaConsistency({ action: 'block' });
    const result = await guard.check('Based on my training data, this is correct.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects "my knowledge cutoff"', async () => {
    const guard = personaConsistency({ action: 'block' });
    const result = await guard.check('My knowledge cutoff is April 2024.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows clean persona output', async () => {
    const guard = personaConsistency({ action: 'block' });
    const result = await guard.check('I would be happy to help you with that question.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('respects allowedPhrases override', async () => {
    const guard = personaConsistency({ action: 'block', allowedPhrases: ['as an AI'] });
    const result = await guard.check('As an AI assistant, I can help.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
