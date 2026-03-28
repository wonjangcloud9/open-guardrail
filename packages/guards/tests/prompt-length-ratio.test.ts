import { describe, it, expect } from 'vitest';
import { promptLengthRatio } from '../src/prompt-length-ratio.js';

describe('prompt-length-ratio guard', () => {
  it('detects overly long input', async () => {
    const guard = promptLengthRatio({ action: 'block', typicalMaxLength: 100 });
    const result = await guard.check('a'.repeat(500), { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects suspiciously short input', async () => {
    const guard = promptLengthRatio({ action: 'warn', typicalMinLength: 10 });
    const result = await guard.check('hi', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects empty input', async () => {
    const guard = promptLengthRatio({ action: 'block' });
    const result = await guard.check('', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal length input', async () => {
    const guard = promptLengthRatio({ action: 'block' });
    const result = await guard.check('What is the weather forecast for tomorrow in Seoul?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects excessive whitespace padding', async () => {
    const guard = promptLengthRatio({ action: 'block', typicalMaxLength: 5000 });
    const result = await guard.check('inject' + ' '.repeat(200) + 'payload', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('returns input length in details', async () => {
    const guard = promptLengthRatio({ action: 'block', typicalMaxLength: 10 });
    const result = await guard.check('a'.repeat(50), { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect((result.details as any).inputLength).toBe(50);
  });
});
