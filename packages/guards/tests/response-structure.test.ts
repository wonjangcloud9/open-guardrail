import { describe, it, expect } from 'vitest';
import { responseStructure } from '../src/response-structure.js';

const ctx = { pipelineType: 'output' as const };

describe('response-structure guard', () => {
  it('detects unbalanced braces', async () => {
    const guard = responseStructure({ action: 'block' });
    const result = await guard.check('{"key": "value"', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects unbalanced brackets', async () => {
    const guard = responseStructure({ action: 'block' });
    const result = await guard.check('[1, 2, 3', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects unclosed code block', async () => {
    const guard = responseStructure({ action: 'warn' });
    const result = await guard.check('Here is code:\n```python\nprint("hi")\n', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects heading hierarchy skip', async () => {
    const guard = responseStructure({ action: 'block' });
    const result = await guard.check('# Title\n### Skipped H2', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows balanced JSON', async () => {
    const guard = responseStructure({ action: 'block' });
    const result = await guard.check('{"key": "value", "arr": [1, 2]}', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows proper heading hierarchy', async () => {
    const guard = responseStructure({ action: 'block' });
    const result = await guard.check('# Title\n## Subtitle\n### Detail', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows plain text', async () => {
    const guard = responseStructure({ action: 'block' });
    const result = await guard.check('This is just normal text without structure', ctx);
    expect(result.passed).toBe(true);
  });
});
