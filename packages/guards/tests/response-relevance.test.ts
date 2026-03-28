import { describe, it, expect } from 'vitest';
import { responseRelevance } from '../src/response-relevance.js';

describe('response-relevance guard', () => {
  it('detects AI preamble', async () => {
    const guard = responseRelevance({ action: 'warn' });
    const result = await guard.check('As an AI language model, I cannot do that.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects great question pattern', async () => {
    const guard = responseRelevance({ action: 'warn' });
    const result = await guard.check('Great question! Let me explain...', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects excessive preamble', async () => {
    const guard = responseRelevance({ action: 'warn' });
    const result = await guard.check('Before I answer, let me provide some context...', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects happy to help', async () => {
    const guard = responseRelevance({ action: 'warn' });
    const result = await guard.check("I'd be happy to help with that!", { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows direct answers', async () => {
    const guard = responseRelevance({ action: 'block' });
    const result = await guard.check('The capital of France is Paris.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows technical content', async () => {
    const guard = responseRelevance({ action: 'block' });
    const result = await guard.check('To install the package, run npm install express.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
