import { describe, it, expect } from 'vitest';
import { outputTruncation } from '../src/output-truncation.js';

describe('output-truncation guard', () => {
  it('detects text ending mid-sentence', async () => {
    const guard = outputTruncation({ action: 'warn' });
    const result = await guard.check('The answer is approximately', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects unclosed brackets', async () => {
    const guard = outputTruncation({ action: 'warn' });
    const result = await guard.check('function foo(bar, baz {', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects incomplete code blocks', async () => {
    const guard = outputTruncation({ action: 'warn' });
    const result = await guard.check('Here is the code:\n```python\ndef hello():', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects ellipsis ending', async () => {
    const guard = outputTruncation({ action: 'warn' });
    const result = await guard.check('There are many reasons for this...', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows complete text', async () => {
    const guard = outputTruncation({ action: 'warn' });
    const result = await guard.check('The answer is 42.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('detects incomplete list items', async () => {
    const guard = outputTruncation({ action: 'warn' });
    const result = await guard.check('1. First item\n2. Second item\n3. ', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns details with signal names', async () => {
    const guard = outputTruncation({ action: 'warn' });
    const result = await guard.check('Incomplete text...', { pipelineType: 'output' });
    expect(result.details).toBeDefined();
  });
});
