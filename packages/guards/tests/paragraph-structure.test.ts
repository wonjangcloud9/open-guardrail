import { describe, it, expect } from 'vitest';
import { paragraphStructure } from '../src/paragraph-structure.js';

const ctx = { pipelineType: 'output' as const };

describe('paragraph-structure guard', () => {
  it('passes well-structured paragraphs', async () => {
    const guard = paragraphStructure({ action: 'warn' });
    const text = 'First sentence. Second sentence.\n\nAnother paragraph. With two sentences.';
    const result = await guard.check(text, ctx);
    expect(result.passed).toBe(true);
  });

  it('detects extremely long paragraphs', async () => {
    const guard = paragraphStructure({ action: 'block', maxWords: 20 });
    const words = Array(25).fill('word').join(' ');
    const result = await guard.check(`${words}. Another sentence here.`, ctx);
    expect(result.passed).toBe(false);
  });

  it('detects single-sentence paragraphs', async () => {
    const guard = paragraphStructure({ action: 'warn' });
    const text = 'This is a single sentence paragraph that is long enough to warrant expansion into multiple sentences.';
    const result = await guard.check(text, ctx);
    expect(result.passed).toBe(false);
  });

  it('passes empty text', async () => {
    const guard = paragraphStructure({ action: 'block' });
    const result = await guard.check('', ctx);
    expect(result.passed).toBe(true);
  });

  it('ignores headings and lists', async () => {
    const guard = paragraphStructure({ action: 'warn' });
    const result = await guard.check('# Heading\n\n- item 1\n- item 2', ctx);
    expect(result.passed).toBe(true);
  });

  it('reports paragraph count in details', async () => {
    const guard = paragraphStructure({ action: 'warn', maxWords: 5 });
    const text = 'Short. But ok.\n\nAnother paragraph that is way too long for the limit we set.';
    const result = await guard.check(text, ctx);
    expect(result.details?.paragraphCount).toBeDefined();
  });
});
