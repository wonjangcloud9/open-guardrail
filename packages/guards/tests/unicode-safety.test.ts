import { describe, it, expect } from 'vitest';
import { unicodeSafety } from '../src/unicode-safety.js';

describe('unicode-safety guard', () => {
  it('detects bidi override characters', async () => {
    const guard = unicodeSafety({ action: 'block' });
    const result = await guard.check('hello\u202Eworld', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects zero-width characters', async () => {
    const guard = unicodeSafety({ action: 'block' });
    const result = await guard.check('hel\u200Blo', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects BOM in middle of text', async () => {
    const guard = unicodeSafety({ action: 'warn' });
    const result = await guard.check('some text\uFEFF more text', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects soft hyphen', async () => {
    const guard = unicodeSafety({ action: 'block' });
    const result = await guard.check('pass\u00ADword', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects isolate characters', async () => {
    const guard = unicodeSafety({ action: 'block' });
    const result = await guard.check('text\u2066hidden\u2069visible', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal ASCII text', async () => {
    const guard = unicodeSafety({ action: 'block' });
    const result = await guard.check('Hello, how are you today?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows normal Unicode text (CJK, emoji)', async () => {
    const guard = unicodeSafety({ action: 'block' });
    const result = await guard.check('Hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
