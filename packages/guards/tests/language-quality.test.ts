import { describe, it, expect } from 'vitest';
import { languageQuality } from '../src/language-quality.js';
const ctx = { pipelineType: 'output' as const };
describe('language-quality', () => {
  it('detects missing capitalization', async () => {
    expect((await languageQuality({ action: 'warn', checks: ['capitalization'] }).check('this sentence is not capitalized. neither is this.', ctx)).passed).toBe(false);
  });
  it('detects repeated words', async () => {
    expect((await languageQuality({ action: 'warn', checks: ['repeated-words'] }).check('The the cat sat on the mat.', ctx)).passed).toBe(false);
  });
  it('allows well-formatted text', async () => {
    expect((await languageQuality({ action: 'block' }).check('This is a well-formatted sentence.', ctx)).passed).toBe(true);
  });
});
