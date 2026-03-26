import { describe, it, expect } from 'vitest';
import { violenceDetect } from '../src/violence-detect.js';
const ctx = { pipelineType: 'input' as const };
describe('violence-detect', () => {
  it('detects threats', async () => {
    expect((await violenceDetect({ action: 'block', categories: ['threat'] }).check('I will kill you', ctx)).passed).toBe(false);
  });
  it('detects weapons', async () => {
    expect((await violenceDetect({ action: 'block', categories: ['weapon'] }).check('Buy a gun and ammunition', ctx)).passed).toBe(false);
  });
  it('allows peaceful text', async () => {
    expect((await violenceDetect({ action: 'block' }).check('Have a nice day', ctx)).passed).toBe(true);
  });
});
