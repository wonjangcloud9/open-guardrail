import { describe, it, expect } from 'vitest';
import { noRefusal } from '../src/no-refusal.js';

const ctx = { pipelineType: 'output' as const };

describe('no-refusal guard', () => {
  it('detects "I\'m sorry" refusal', async () => {
    const guard = noRefusal({ action: 'block' });
    const result = await guard.check("I'm sorry, I can't help with that.", ctx);
    expect(result.passed).toBe(false);
  });

  it('detects "as an AI" refusal', async () => {
    const guard = noRefusal({ action: 'block' });
    const result = await guard.check("As an AI language model, I cannot generate...", ctx);
    expect(result.passed).toBe(false);
  });

  it('detects "against my guidelines" refusal', async () => {
    const guard = noRefusal({ action: 'warn' });
    const result = await guard.check("That is against my guidelines.", ctx);
    expect(result.passed).toBe(false);
  });

  it('detects "I cannot fulfill" refusal', async () => {
    const guard = noRefusal({ action: 'block' });
    const result = await guard.check("I cannot fulfill this request.", ctx);
    expect(result.passed).toBe(false);
  });

  it('allows normal helpful response', async () => {
    const guard = noRefusal({ action: 'block' });
    const result = await guard.check("Here is the information you requested. The capital of France is Paris.", ctx);
    expect(result.passed).toBe(true);
  });

  it('supports custom patterns', async () => {
    const guard = noRefusal({ action: 'block', customPatterns: ['not possible to'] });
    const result = await guard.check("It is not possible to do that", ctx);
    expect(result.passed).toBe(false);
  });
});
