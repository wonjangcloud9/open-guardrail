import { describe, it, expect } from 'vitest';
import { toolOutputSanitize } from '../src/tool-output-sanitize.js';

describe('tool-output-sanitize', () => {
  const guard = toolOutputSanitize({
    action: 'warn',
    stripHtml: true,
  });
  const ctx = { pipelineType: 'output' as const };

  it('passes clean text', async () => {
    const r = await guard.check('Hello', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('sanitizes HTML tags', async () => {
    const r = await guard.check(
      '<script>alert(1)</script>data',
      ctx,
    );
    expect(r.passed).toBe(true);
    expect(r.action).toBe('override');
    expect(r.overrideText).toBe('alert(1)data');
  });
});
