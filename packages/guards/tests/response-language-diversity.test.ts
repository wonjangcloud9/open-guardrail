import { describe, it, expect } from 'vitest';
import { responseLanguageDiversity } from '../src/response-language-diversity.js';

describe('response-language-diversity guard', () => {
  it('flags extremely repetitive text', async () => {
    const guard = responseLanguageDiversity({ action: 'warn', minDiversity: 0.3 });
    const result = await guard.check('the the the the the the the the the the the the the the the', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows diverse natural language', async () => {
    const guard = responseLanguageDiversity({ action: 'block', minDiversity: 0.2 });
    const text = 'The quantum computer processes information using qubits. Unlike classical bits, these can exist in superposition states. Researchers at major laboratories have demonstrated remarkable advances in error correction techniques.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns diversity score in details', async () => {
    const guard = responseLanguageDiversity({ action: 'warn' });
    const result = await guard.check('Hello world this is a test sentence with varied words.', { pipelineType: 'output' });
    expect(result.details?.diversity).toBeDefined();
    expect(result.details?.diversity).toBeGreaterThan(0);
  });

  it('allows short text', async () => {
    const guard = responseLanguageDiversity({ action: 'block', minDiversity: 0.3 });
    const result = await guard.check('Yes.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('respects custom minDiversity threshold', async () => {
    const guard = responseLanguageDiversity({ action: 'warn', minDiversity: 0.99 });
    const result = await guard.check('This is a normal sentence with some repeated words in the sentence.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
