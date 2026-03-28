import { describe, it, expect } from 'vitest';
import { citationVerify } from '../src/citation-verify.js';

describe('citation-verify guard', () => {
  it('passes clean numbered citations', async () => {
    const guard = citationVerify({ action: 'warn', requiredFormat: 'number' });
    const text = 'According to research [1], AI is advancing. Further work [2] confirms this.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('fails when number format required but absent', async () => {
    const guard = citationVerify({ action: 'warn', requiredFormat: 'number' });
    const text = 'This is a long text without any citations that should be flagged for missing references.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects mixed citation formats', async () => {
    const guard = citationVerify({ action: 'warn' });
    const text = 'See [1] and also (Smith, 2020) for more details on this important topic.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes valid author-year format', async () => {
    const guard = citationVerify({ action: 'warn', requiredFormat: 'author-year' });
    const text = 'As noted by (Smith, 2020) and (Jones et al., 2021), the results are clear.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows short text without citations', async () => {
    const guard = citationVerify({ action: 'warn', requiredFormat: 'number' });
    const result = await guard.check('Hello world.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects non-sequential number refs', async () => {
    const guard = citationVerify({ action: 'warn' });
    const text = 'See [1] and then [5] for more. This skips numbers in citations.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
