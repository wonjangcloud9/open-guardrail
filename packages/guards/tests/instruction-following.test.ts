import { describe, it, expect } from 'vitest';
import { instructionFollowing } from '../src/instruction-following.js';

describe('instruction-following guard', () => {
  it('detects prose when list expected', async () => {
    const guard = instructionFollowing({ action: 'warn', expectedFormat: 'list' });
    const result = await guard.check('This is a paragraph of text without any list items.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes when list detected and list expected', async () => {
    const guard = instructionFollowing({ action: 'warn', expectedFormat: 'list' });
    const result = await guard.check('- Item one\n- Item two\n- Item three', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects non-json when json expected', async () => {
    const guard = instructionFollowing({ action: 'warn', expectedFormat: 'json' });
    const result = await guard.check('This is plain text, not JSON.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes valid json when json expected', async () => {
    const guard = instructionFollowing({ action: 'warn', expectedFormat: 'json' });
    const result = await guard.check('{"name": "test", "value": 42}', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('passes anything when format is any', async () => {
    const guard = instructionFollowing({ action: 'warn', expectedFormat: 'any' });
    const result = await guard.check('Some random text here.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects excessively long response', async () => {
    const guard = instructionFollowing({ action: 'warn' });
    const longText = Array(600).fill('word').join(' ');
    const result = await guard.check(longText, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns score between 0 and 1', async () => {
    const guard = instructionFollowing({ action: 'warn', expectedFormat: 'code' });
    const result = await guard.check('Just some text.', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
