import { describe, it, expect } from 'vitest';
import { inputEncodingCheck } from '../src/input-encoding-check.js';

describe('input-encoding-check', () => {
  it('allows clean ASCII text', async () => {
    const guard = inputEncodingCheck({ action: 'block' });
    const result = await guard.check('Hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects BOM markers', async () => {
    const guard = inputEncodingCheck({ action: 'block' });
    const result = await guard.check('\uFEFFHello', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects null bytes', async () => {
    const guard = inputEncodingCheck({ action: 'block' });
    const result = await guard.check('Hello\x00World', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects overlong encoding patterns', async () => {
    const guard = inputEncodingCheck({ action: 'warn' });
    const result = await guard.check('test%c0%80payload', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal UTF-8 text', async () => {
    const guard = inputEncodingCheck({ action: 'block' });
    const result = await guard.check('Hello from Korea!', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows empty text', async () => {
    const guard = inputEncodingCheck({ action: 'block' });
    const result = await guard.check('', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
