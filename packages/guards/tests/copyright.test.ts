import { describe, it, expect } from 'vitest';
import { copyright } from '../src/copyright.js';

describe('copyright guard', () => {
  it('detects copyright symbols', async () => {
    const guard = copyright({ action: 'warn' });
    const result = await guard.check('This content is © 2024 Acme Corp. All rights reserved.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects "all rights reserved" text', async () => {
    const guard = copyright({ action: 'block' });
    const result = await guard.check('All Rights Reserved. Do not reproduce.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects license text patterns', async () => {
    const guard = copyright({ action: 'warn' });
    const result = await guard.check('Licensed under the MIT License. Copyright 2024 John Doe.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.matches).toBeDefined();
  });

  it('detects trademark symbols', async () => {
    const guard = copyright({ action: 'warn' });
    const result = await guard.check('iPhone™ is a product of Apple®', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows clean text without copyright markers', async () => {
    const guard = copyright({ action: 'block' });
    const result = await guard.check('The weather today is sunny and warm.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects verbatim reproduction patterns', async () => {
    const guard = copyright({ action: 'block', detectVerbatim: true, maxQuoteLength: 50 });
    const longQuote = '"' + 'a'.repeat(60) + '"';
    const result = await guard.check(`Here is the text: ${longQuote}`, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows short quotes', async () => {
    const guard = copyright({ action: 'block', detectVerbatim: true, maxQuoteLength: 50 });
    const result = await guard.check('He said "hello world"', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns score based on number of matches', async () => {
    const guard = copyright({ action: 'warn' });
    const result = await guard.check('© 2024 Acme. All rights reserved. Licensed under MIT.', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
  });
});
