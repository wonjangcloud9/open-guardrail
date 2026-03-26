import { describe, it, expect } from 'vitest';
import { invisibleText } from '../src/invisible-text.js';

const ctx = { pipelineType: 'input' as const };

describe('invisible-text guard', () => {
  it('detects zero-width characters', async () => {
    const guard = invisibleText({ action: 'block' });
    const result = await guard.check('hello\u200Bworld', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.types).toContain('zero-width');
  });

  it('detects BOM character', async () => {
    const guard = invisibleText({ action: 'block' });
    const result = await guard.check('\uFEFFHello', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.types).toContain('bom');
  });

  it('detects bidi control characters', async () => {
    const guard = invisibleText({ action: 'block' });
    const result = await guard.check('hello\u202Eworld', ctx);
    expect(result.passed).toBe(false);
  });

  it('sanitizes invisible characters', async () => {
    const guard = invisibleText({ action: 'sanitize' });
    const result = await guard.check('hel\u200Blo\u200Bworld', ctx);
    expect(result.passed).toBe(true);
    expect(result.overrideText).toBe('helloworld');
  });

  it('allows clean text', async () => {
    const guard = invisibleText({ action: 'block' });
    const result = await guard.check('Hello world, this is normal text.', ctx);
    expect(result.passed).toBe(true);
  });

  it('reports invisible count', async () => {
    const guard = invisibleText({ action: 'warn' });
    const result = await guard.check('\u200B\u200C\u200D', ctx);
    expect(result.details?.invisibleCount).toBe(3);
  });
});
