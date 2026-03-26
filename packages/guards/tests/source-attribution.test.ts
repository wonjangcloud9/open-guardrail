import { describe, it, expect } from 'vitest';
import { sourceAttribution } from '../src/source-attribution.js';
const ctx = { pipelineType: 'output' as const };
describe('source-attribution', () => {
  it('blocks response without sources', async () => { expect((await sourceAttribution({ action: 'block', minSources: 1 }).check('Water boils at 100C.', ctx)).passed).toBe(false); });
  it('allows response with citation', async () => { expect((await sourceAttribution({ action: 'block', minSources: 1 }).check('According to Smith (2024), water boils at 100C [1].', ctx)).passed).toBe(true); });
});
