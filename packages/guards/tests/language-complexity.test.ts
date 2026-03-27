import { describe, it, expect } from 'vitest';
import { languageComplexity } from '../src/language-complexity.js';

describe('language-complexity guard', () => {
  it('passes simple text with high max grade', async () => {
    const guard = languageComplexity({ action: 'block', maxGradeLevel: 20, minGradeLevel: -100 });
    const r = await guard.check('I like to eat a red apple. It is good.', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
  it('blocks complex text with low max grade', async () => {
    const guard = languageComplexity({ action: 'block', maxGradeLevel: 2 });
    const r = await guard.check('The epistemological ramifications of quantum decoherence manifest through ontological paradigm shifts.', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
