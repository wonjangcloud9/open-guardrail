import { describe, it, expect } from 'vitest';
import { contentLengthRatio } from '../src/content-length-ratio.js';

describe('content-length-ratio guard', () => {
  it('detects markup-heavy response', async () => {
    const guard = contentLengthRatio({ action: 'warn' });
    const result = await guard.check('<div><span><b><i></i></b></span></div><div><span></span></div>', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes content-rich response', async () => {
    const guard = contentLengthRatio({ action: 'warn' });
    const result = await guard.check('This is a helpful response with lots of useful information and no markup at all.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects empty response', async () => {
    const guard = contentLengthRatio({ action: 'warn' });
    const result = await guard.check('', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('respects custom minContentRatio', async () => {
    const guard = contentLengthRatio({ action: 'warn', minContentRatio: 0.8 });
    const result = await guard.check('Text <b>bold</b> more text', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns content ratio in details', async () => {
    const guard = contentLengthRatio({ action: 'warn' });
    const result = await guard.check('Hello world', { pipelineType: 'output' });
    expect(result.details).toHaveProperty('contentRatio');
  });

  it('handles whitespace-heavy response', async () => {
    const guard = contentLengthRatio({ action: 'warn', minContentRatio: 0.8 });
    const result = await guard.check('   a   b   c   d   e   ', { pipelineType: 'output' });
    expect(result.details).toBeDefined();
  });
});
