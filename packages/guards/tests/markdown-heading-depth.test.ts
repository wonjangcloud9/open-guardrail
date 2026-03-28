import { describe, it, expect } from 'vitest';
import { markdownHeadingDepth } from '../src/markdown-heading-depth.js';

const ctx = { pipelineType: 'output' as const };

describe('markdown-heading-depth guard', () => {
  it('passes valid heading hierarchy', async () => {
    const guard = markdownHeadingDepth({ action: 'warn' });
    const result = await guard.check('# Title\n\n## Section\n\n### Sub', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects skipped heading levels', async () => {
    const guard = markdownHeadingDepth({ action: 'block' });
    const result = await guard.check('# Title\n\n### Skipped h2', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.issues).toBeDefined();
  });

  it('detects headings exceeding max depth', async () => {
    const guard = markdownHeadingDepth({ action: 'warn', maxDepth: 3 });
    const result = await guard.check('# A\n\n## B\n\n### C\n\n#### D', ctx);
    expect(result.passed).toBe(false);
  });

  it('respects default maxDepth of 4', async () => {
    const guard = markdownHeadingDepth({ action: 'warn' });
    const result = await guard.check('# A\n\n## B\n\n### C\n\n#### D', ctx);
    expect(result.passed).toBe(true);
  });

  it('passes text with no headings', async () => {
    const guard = markdownHeadingDepth({ action: 'block' });
    const result = await guard.check('Just some plain text.', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects h5 exceeding default max', async () => {
    const guard = markdownHeadingDepth({ action: 'warn' });
    const result = await guard.check('# A\n\n## B\n\n### C\n\n#### D\n\n##### E', ctx);
    expect(result.passed).toBe(false);
  });
});
