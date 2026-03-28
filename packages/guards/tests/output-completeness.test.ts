import { describe, it, expect } from 'vitest';
import { outputCompleteness } from '../src/output-completeness.js';

describe('output-completeness', () => {
  it('allows complete text', async () => {
    const guard = outputCompleteness({ action: 'block' });
    const result = await guard.check('This is a complete sentence.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects continuation phrases', async () => {
    const guard = outputCompleteness({ action: 'block' });
    const result = await guard.check("Here's part 1. I'll continue in the next message.", { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects mid-sentence cutoffs', async () => {
    const guard = outputCompleteness({ action: 'warn' });
    const result = await guard.check('The implementation should include the following components and', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects unclosed HTML tags', async () => {
    const guard = outputCompleteness({ action: 'block' });
    const result = await guard.check('<div><p>Hello world', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows empty text', async () => {
    const guard = outputCompleteness({ action: 'block' });
    const result = await guard.check('', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows text ending with punctuation', async () => {
    const guard = outputCompleteness({ action: 'block' });
    const result = await guard.check('Is this complete?', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects "to be continued"', async () => {
    const guard = outputCompleteness({ action: 'block' });
    const result = await guard.check('The analysis shows promising results. To be continued', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
