import { describe, it, expect } from 'vitest';
import { responseLengthRatio } from '../src/response-length-ratio.js';

describe('response-length-ratio guard', () => {
  it('passes normal ratio', async () => {
    const guard = responseLengthRatio({ action: 'warn', inputText: 'What is AI?', minRatio: 0.5, maxRatio: 100 });
    const r = await guard.check('Artificial intelligence is a branch of computer science.', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('blocks too-long response', async () => {
    const guard = responseLengthRatio({ action: 'warn', inputText: 'Hi', maxRatio: 5 });
    const r = await guard.check('a'.repeat(100), { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
