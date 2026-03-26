import { describe, it, expect } from 'vitest';
import { markdownStructure } from '../src/markdown-structure.js';
const ctx = { pipelineType: 'output' as const };
describe('markdown-structure', () => {
  it('requires heading', async () => { expect((await markdownStructure({ action: 'block', requireHeading: true }).check('No heading here', ctx)).passed).toBe(false); });
  it('allows with heading', async () => { expect((await markdownStructure({ action: 'block', requireHeading: true }).check('# Title\nContent', ctx)).passed).toBe(true); });
  it('requires min sections', async () => { expect((await markdownStructure({ action: 'warn', minSections: 3 }).check('# One\n# Two', ctx)).passed).toBe(false); });
});
