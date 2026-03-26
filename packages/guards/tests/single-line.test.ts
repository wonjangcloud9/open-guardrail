import { describe, it, expect } from 'vitest';
import { singleLine } from '../src/single-line.js';

const ctx = { pipelineType: 'output' as const };

describe('single-line guard', () => {
  it('allows single line text', async () => {
    const guard = singleLine({ action: 'block' });
    const result = await guard.check('Just one line here', ctx);
    expect(result.passed).toBe(true);
  });

  it('blocks multi-line text', async () => {
    const guard = singleLine({ action: 'block' });
    const result = await guard.check('Line one\nLine two', ctx);
    expect(result.passed).toBe(false);
  });

  it('trims whitespace by default', async () => {
    const guard = singleLine({ action: 'block' });
    const result = await guard.check('  one line  \n  ', ctx);
    expect(result.passed).toBe(true);
  });

  it('reports line count', async () => {
    const guard = singleLine({ action: 'warn' });
    const result = await guard.check('a\nb\nc', ctx);
    expect(result.details?.lineCount).toBe(3);
  });
});
