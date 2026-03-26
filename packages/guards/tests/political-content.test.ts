import { describe, it, expect } from 'vitest';
import { politicalContent } from '../src/political-content.js';
const ctx = { pipelineType: 'input' as const };
describe('political-content', () => {
  it('detects campaign language', async () => { expect((await politicalContent({ action: 'block' }).check('Vote for the republican candidate', ctx)).passed).toBe(false); });
  it('allows neutral', async () => { expect((await politicalContent({ action: 'block' }).check('What is the capital of France?', ctx)).passed).toBe(true); });
});
