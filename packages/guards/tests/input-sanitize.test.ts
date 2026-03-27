import { describe, it, expect } from 'vitest';
import { inputSanitize } from '../src/input-sanitize.js';

describe('input-sanitize guard', () => {
  it('passes clean text', async () => {
    const guard = inputSanitize({ action: 'block' });
    const r = await guard.check('Hello world', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });

  it('detects null bytes', async () => {
    const guard = inputSanitize({ action: 'block' });
    const r = await guard.check('Hello\0world', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
    expect(r.details?.sanitized).toContain('null-bytes');
  });

  it('strips HTML in mask mode', async () => {
    const guard = inputSanitize({ action: 'mask' });
    const r = await guard.check('<script>alert(1)</script>Hello', { pipelineType: 'input' });
    expect(r.action).toBe('override');
    expect(r.overrideText).toBe('alert(1)Hello');
  });

  it('has latencyMs', async () => {
    const guard = inputSanitize({ action: 'block' });
    const r = await guard.check('test', { pipelineType: 'input' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
