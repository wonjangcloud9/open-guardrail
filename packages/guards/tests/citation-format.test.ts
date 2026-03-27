import { describe, it, expect } from 'vitest';
import { citationFormat } from '../src/citation-format.js';

describe('citation-format guard', () => {
  it('passes text with enough citations', async () => {
    const guard = citationFormat({ action: 'block', minCitations: 2 });
    const r = await guard.check('See source [1] and also [2] for details.', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
  it('blocks text with no citations', async () => {
    const guard = citationFormat({ action: 'block', minCitations: 1 });
    const r = await guard.check('This text has no citations at all.', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
